package seed

import (
	"encoding/json"
	"fazbrike-backend/models"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"

	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type cityCoordRow struct {
	Codigo    int64  `json:"codigo"`
	Latitude  string `json:"latitude"`
	Longitude string `json:"longitude"`
	IBGE      string `json:"ibge"`
}

// SeedLocations loads País/Estado/Cidade from adapted NinhoHouse SQL + coordinates JSON.
// Idempotent: skips SQL insert when cities already exist; always fills missing coords/geography.
func SeedLocations(db *gorm.DB) error {
	var count int64
	if err := db.Model(&models.City{}).Count(&count).Error; err != nil {
		return err
	}

	if count == 0 {
		sqlPath, err := seedFilePath("sql", "locations.sql")
		if err != nil {
			return err
		}
		sqlBytes, err := os.ReadFile(sqlPath)
		if err != nil {
			return fmt.Errorf("read locations.sql: %w", err)
		}

		log.Println("locations: inserting countries/states/cities…")
		quiet := db.Session(&gorm.Session{Logger: logger.Default.LogMode(logger.Silent)})
		if err := execSQLStatements(quiet, string(sqlBytes)); err != nil {
			return fmt.Errorf("exec locations.sql: %w", err)
		}
		if err := db.Model(&models.City{}).Count(&count).Error; err != nil {
			return err
		}
		log.Printf("locations: inserted %d cities", count)
	} else {
		log.Printf("locations: skip SQL seed (%d cities already present)", count)
	}

	if err := seedCityCoordinates(db); err != nil {
		return err
	}
	if err := ensureCityGeography(db); err != nil {
		return err
	}
	return nil
}

func execSQLStatements(db *gorm.DB, script string) error {
	var stmt strings.Builder
	flush := func() error {
		sql := strings.TrimSpace(stmt.String())
		stmt.Reset()
		if sql == "" || strings.HasPrefix(sql, "--") {
			return nil
		}
		if err := db.Exec(sql).Error; err != nil {
			preview := sql
			if len(preview) > 120 {
				preview = preview[:120] + "…"
			}
			return fmt.Errorf("%w (near: %s)", err, preview)
		}
		return nil
	}

	for _, line := range strings.Split(script, "\n") {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" {
			continue
		}
		if strings.HasPrefix(trimmed, "--") && stmt.Len() == 0 {
			continue
		}
		stmt.WriteString(line)
		stmt.WriteByte('\n')
		if strings.HasSuffix(trimmed, ";") {
			if err := flush(); err != nil {
				return err
			}
		}
	}
	return flush()
}

func seedCityCoordinates(db *gorm.DB) error {
	var missing int64
	if err := db.Model(&models.City{}).Where("latitude IS NULL OR longitude IS NULL").Count(&missing).Error; err != nil {
		return err
	}
	if missing == 0 {
		log.Println("locations: coordinates already filled")
		return nil
	}

	jsonPath, err := seedFilePath("data", "city_coordinates.json")
	if err != nil {
		return err
	}
	raw, err := os.ReadFile(jsonPath)
	if err != nil {
		return fmt.Errorf("read city_coordinates.json: %w", err)
	}
	var rows []cityCoordRow
	if err := json.Unmarshal(raw, &rows); err != nil {
		return fmt.Errorf("parse city_coordinates.json: %w", err)
	}

	quiet := db.Session(&gorm.Session{Logger: logger.Default.LogMode(logger.Silent)})
	const batchSize = 200
	updated := 0
	for i := 0; i < len(rows); i += batchSize {
		end := i + batchSize
		if end > len(rows) {
			end = len(rows)
		}
		batch := rows[i:end]
		var values []string
		for _, row := range batch {
			lat, errLat := strconv.ParseFloat(row.Latitude, 64)
			lng, errLng := strconv.ParseFloat(row.Longitude, 64)
			if errLat != nil || errLng != nil {
				continue
			}
			ibge := strings.ReplaceAll(row.IBGE, "'", "''")
			values = append(values, fmt.Sprintf("(%d, %s, %s, '%s')", row.Codigo, formatFloat(lat), formatFloat(lng), ibge))
		}
		if len(values) == 0 {
			continue
		}
		sql := fmt.Sprintf(`
			UPDATE cities AS c
			SET latitude = v.latitude,
			    longitude = v.longitude,
			    ibge = v.ibge
			FROM (VALUES %s) AS v(id, latitude, longitude, ibge)
			WHERE c.id = v.id
			  AND (c.latitude IS NULL OR c.longitude IS NULL OR c.ibge IS NULL)
		`, strings.Join(values, ","))
		res := quiet.Exec(sql)
		if res.Error != nil {
			return fmt.Errorf("update city coordinates batch: %w", res.Error)
		}
		updated += int(res.RowsAffected)
	}
	log.Printf("locations: updated coordinates for %d cities", updated)
	return nil
}

func formatFloat(f float64) string {
	return strconv.FormatFloat(f, 'f', -1, 64)
}

// EnsureLocationSchema adds PostGIS geography columns, unique indexes, and GiST indexes.
func EnsureLocationSchema(db *gorm.DB) error {
	stmts := []string{
		`CREATE UNIQUE INDEX IF NOT EXISTS idx_states_country_code ON states (country_id, code)`,
		`ALTER TABLE cities ADD COLUMN IF NOT EXISTS location geography(Point, 4326)`,
		`CREATE INDEX IF NOT EXISTS idx_cities_location_gist ON cities USING GIST (location)`,
		`CREATE INDEX IF NOT EXISTS idx_cities_name_lower ON cities (LOWER(name))`,
		`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS location geography(Point, 4326)`,
		`CREATE INDEX IF NOT EXISTS idx_user_profiles_location_gist ON user_profiles USING GIST (location)`,
		`CREATE INDEX IF NOT EXISTS idx_items_status_active ON items (status) WHERE status = 'active'`,
		`DO $$ BEGIN
			ALTER TABLE items DROP CONSTRAINT IF EXISTS items_status_check;
			ALTER TABLE items ADD CONSTRAINT items_status_check
				CHECK (status IN ('active', 'reserved', 'sold', 'inactive'));
		EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
		`DO $$ BEGIN
			ALTER TABLE follows ADD CONSTRAINT follows_not_self_check
				CHECK (follower_id <> following_id);
		EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
		`DO $$ BEGIN
			ALTER TABLE reviews ADD CONSTRAINT reviews_rating_check
				CHECK (rating >= 1 AND rating <= 5);
		EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
		`CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_pair_item
			ON reviews (reviewer_id, reviewee_id, item_id) NULLS NOT DISTINCT`,
		`CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_created
			ON reviews (reviewee_id, created_at DESC)`,
	}
	for _, stmt := range stmts {
		if err := db.Exec(stmt).Error; err != nil {
			return fmt.Errorf("location schema: %w\nstmt: %s", err, stmt)
		}
	}
	return nil
}

func ensureCityGeography(db *gorm.DB) error {
	res := db.Exec(`
		UPDATE cities
		SET location = ST_SetSRID(ST_MakePoint(longitude::double precision, latitude::double precision), 4326)::geography
		WHERE latitude IS NOT NULL
		  AND longitude IS NOT NULL
		  AND location IS NULL
	`)
	if res.Error != nil {
		return fmt.Errorf("populate city location: %w", res.Error)
	}
	if res.RowsAffected > 0 {
		log.Printf("locations: populated geography for %d cities", res.RowsAffected)
	} else {
		log.Println("locations: geography already populated")
	}
	return nil
}

func seedFilePath(parts ...string) (string, error) {
	_, thisFile, _, ok := runtime.Caller(0)
	if !ok {
		return "", fmt.Errorf("resolve seed path")
	}
	base := filepath.Join(filepath.Dir(thisFile), filepath.Join(parts...))
	if _, err := os.Stat(base); err == nil {
		return base, nil
	}
	alt := filepath.Join(append([]string{"seed"}, parts...)...)
	if _, err := os.Stat(alt); err == nil {
		return alt, nil
	}
	return "", fmt.Errorf("seed file not found: %s", strings.Join(parts, "/"))
}
