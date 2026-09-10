package admin

import (
	"encoding/json"
	"fmt"
	"net/http"
	"reflect"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ListResponse é o formato da listagem.
type ListResponse struct {
	Data       []map[string]interface{} `json:"data"`
	Total      int64                    `json:"total"`
	Page       int                      `json:"page"`
	PerPage    int                      `json:"perPage"`
	TotalPages int                      `json:"totalPages"`
}

// applyFilter aplica a busca global (?search=...) na query.
func applyFilter(db *gorm.DB, c *RegisteredCollection, search string) *gorm.DB {
	search = strings.TrimSpace(search)
	if search == "" || len(c.Meta.Searchable) == 0 {
		return db
	}
	like := "%" + search + "%"
	conds := []string{}
	args := []interface{}{}
	for _, field := range c.Meta.Searchable {
		conds = append(conds, Quote(field)+" LIKE ?")
		args = append(args, like)
	}
	return db.Where(strings.Join(conds, " OR "), args...)
}

// HandleMeta: GET /api/admin/meta
func HandleMeta() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, GetMeta())
	}
}

// atoiDefault converte uma string em int com fallback.
func atoiDefault(s string, def int) int {
	if s == "" {
		return def
	}
	n, err := strconv.Atoi(s)
	if err != nil {
		return def
	}
	return n
}

// applyOrder aplica o parâmetro ?sort=field:desc,field2:asc com fallback no default.
func applyOrder(db *gorm.DB, c *RegisteredCollection, sortParam string) *gorm.DB {
	valid := map[string]bool{}
	for _, f := range c.Meta.Fields {
		valid[f.Key] = true
	}

	type ord struct {
		field string
		desc  bool
	}
	ords := []ord{}

	if sortParam != "" {
		for _, part := range strings.Split(sortParam, ",") {
			parts := strings.SplitN(part, ":", 2)
			field := parts[0]
			if !valid[field] {
				continue
			}
			d := false
			if len(parts) == 2 && (parts[1] == "desc" || parts[1] == "descending") {
				d = true
			}
			ords = append(ords, ord{field, d})
		}
	}
	if len(ords) == 0 {
		for _, o := range DefaultSortFor(c) {
			ords = append(ords, ord{o.Field, o.Desc})
		}
	}
	for _, o := range ords {
		if o.desc {
			db = db.Order(Quote(o.field) + " DESC")
		} else {
			db = db.Order(Quote(o.field) + " ASC")
		}
	}
	return db
}

// Quote envolve um identificador de coluna com aspas para evitar injeção de SQL
// (mesmo assim validamos contra os metadados no applyOrder).
func Quote(col string) string {
	var b strings.Builder
	b.WriteByte('"')
	for _, r := range col {
		if r == '"' {
			b.WriteByte('"')
			b.WriteByte('"')
		} else {
			b.WriteRune(r)
		}
	}
	b.WriteByte('"')
	return b.String()
}

// HandleList: GET /api/admin/:collection
func HandleList() gin.HandlerFunc {
	return func(c *gin.Context) {
		mc := FindCollection(c.Param("collection"))
		if mc == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Collection not found"})
			return
		}

		// Parâmetros de paginação (limited 1..100).
		page := atoiDefault(c.Query("page"), 1)
		perPage := atoiDefault(c.Query("perPage"), 30)
		if page < 1 {
			page = 1
		}
		if perPage < 1 {
			perPage = 1
		}
		if perPage > 100 {
			perPage = 100
		}

		db := applyFilter(dbFrom(c), mc, c.Query("search"))

		totalQ := db.Session(&gorm.Session{})
		var total int64
		totalQ.Model(reflect.New(mc.ModelType).Interface()).Count(&total)

		db = applyOrder(db, mc, c.Query("sort"))
		db = db.Offset((page - 1) * perPage).Limit(perPage)

		rows := []map[string]interface{}{}
		items := reflect.New(reflect.SliceOf(mc.ModelType)).Interface()
		if err := db.Find(items).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		s := reflect.ValueOf(items)
		if s.Kind() == reflect.Ptr {
			s = s.Elem()
		}
		for i := 0; i < s.Len(); i++ {
			rec := s.Index(i)
			row := modelToMap(rec, mc)
			rows = append(rows, row)
		}

		totalPages := 0
		if total > 0 {
			totalPages = int((total + int64(perPage) - 1) / int64(perPage))
		}

		c.JSON(http.StatusOK, ListResponse{
			Data:       rows,
			Total:      total,
			Page:       page,
			PerPage:    perPage,
			TotalPages: totalPages,
		})
	}
}

// HandleGet: GET /api/admin/:collection/:id
func HandleGet() gin.HandlerFunc {
	return func(c *gin.Context) {
		mc := FindCollection(c.Param("collection"))
		if mc == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Collection not found"})
			return
		}
		id := c.Param("id")
		rec := reflect.New(mc.ModelType).Interface()
		if err := dbFrom(c).First(rec, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Record not found"})
			return
		}
		c.JSON(http.StatusOK, modelToMap(reflect.ValueOf(rec).Elem(), mc))
	}
}

// HandleCreate: POST /api/admin/:collection
func HandleCreate() gin.HandlerFunc {
	return func(c *gin.Context) {
		mc := FindCollection(c.Param("collection"))
		if mc == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Collection not found"})
			return
		}

		var payload map[string]json.RawMessage
		if err := c.ShouldBindJSON(&payload); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON: " + err.Error()})
			return
		}

		rec := reflect.New(mc.ModelType).Elem()
		// populate a partir do payload (apenas campos conhecidos).
		if err := populateFromPayload(&rec, mc, payload, false); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := dbFrom(c).Create(rec.Addr().Interface()).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create record: " + err.Error()})
			return
		}

		c.JSON(http.StatusCreated, modelToMap(rec, mc))
	}
}

// HandleUpdate: PUT /api/admin/:collection/:id
func HandleUpdate() gin.HandlerFunc {
	return func(c *gin.Context) {
		mc := FindCollection(c.Param("collection"))
		if mc == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Collection not found"})
			return
		}
		id := c.Param("id")

		rec := reflect.New(mc.ModelType).Elem()
		if err := dbFrom(c).First(rec.Addr().Interface(), id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Record not found"})
			return
		}

		var payload map[string]json.RawMessage
		if err := c.ShouldBindJSON(&payload); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON: " + err.Error()})
			return
		}

		if err := populateFromPayload(&rec, mc, payload, true); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := dbFrom(c).Save(rec.Addr().Interface()).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update record: " + err.Error()})
			return
		}

		c.JSON(http.StatusOK, modelToMap(rec, mc))
	}
}

// HandleDelete: DELETE /api/admin/:collection/:id
func HandleDelete() gin.HandlerFunc {
	return func(c *gin.Context) {
		mc := FindCollection(c.Param("collection"))
		if mc == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Collection not found"})
			return
		}
		id := c.Param("id")
		rec := reflect.New(mc.ModelType).Elem()
		if err := dbFrom(c).First(rec.Addr().Interface(), id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Record not found"})
			return
		}
		if err := dbFrom(c).Delete(rec.Addr().Interface()).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete record: " + err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"success": true})
	}
}

// dbFrom obtém o *gorm.DB salvo no contexto por RegisterRoutes.
func dbFrom(c *gin.Context) *gorm.DB {
	v, _ := c.Get("_admin_db")
	if db, ok := v.(*gorm.DB); ok {
		return db
	}
	// Fallback defensivo (não deve ocorrer).
	panic("admin: database not configured")
}

// modelToMap converte um struct em map[string]interface{} usando as chaves json,
// ignorando campos marcados como "-" (ex.: Password, DeletedAt) e campos de
// relação (structs aninhadas: Sender, Receiver, Item) para não vazar dados
// de outros registros (ex.: emails/roles).
func modelToMap(v reflect.Value, mc *RegisteredCollection) map[string]interface{} {
	out := map[string]interface{}{}
	if v.Kind() != reflect.Struct {
		return out
	}
	// Campos que o meta marca como relação são omitidos do JSON de listagem.
	relationKeys := map[string]bool{}
	for _, fm := range mc.Meta.Fields {
		if fm.Kind == KindRelation {
			relationKeys[fm.Key] = true
		}
	}
	t := v.Type()
	for i := 0; i < t.NumField(); i++ {
		f := t.Field(i)
		jsonTag := f.Tag.Get("json")
		if jsonTag == "" || jsonTag == "-" {
			continue
		}
		key := strings.Split(jsonTag, ",")[0]
		if relationKeys[key] {
			continue
		}
		out[key] = wireValue(v.Field(i))
	}
	return out
}

// wireValue serializa um campo para JSON-amigável (extrai ponteiros/slices a partir do Kind).
func wireValue(v reflect.Value) interface{} {
	switch v.Kind() {
	case reflect.Ptr, reflect.Interface:
		if v.IsNil() {
			return nil
		}
		return wireValue(v.Elem())
	case reflect.Struct:
		// time.Time
		if tv, ok := v.Interface().(time.Time); ok {
			return tv.Format(time.RFC3339)
		}
		return v.Interface()
	case reflect.Slice:
		if v.Len() == 0 {
			return []interface{}{}
		}
		if v.Index(0).Kind() == reflect.Uint8 {
			// []byte -> string base64
			return string(v.Bytes())
		}
		out := make([]interface{}, v.Len())
		for i := 0; i < v.Len(); i++ {
			out[i] = wireValue(v.Index(i))
		}
		return out
	case reflect.Bool:
		return v.Bool()
	default:
		return v.Interface()
	}
}

// fieldIndex mapeia a chave json de volta ao struct field.
func fieldIndex(t reflect.Type, key string) (reflect.StructField, bool) {
	for i := 0; i < t.NumField(); i++ {
		f := t.Field(i)
		jsonTag := f.Tag.Get("json")
		if jsonTag == "" || jsonTag == "-" {
			continue
		}
		if strings.Split(jsonTag, ",")[0] == key {
			return f, true
		}
	}
	return reflect.StructField{}, false
}

// setField grava um valor JSON cru (decodificado) num campo do struct.
func setField(v reflect.Value, field reflect.StructField, raw interface{}) error {
	if raw == nil {
		return nil
	}
	target := v.FieldByIndex(field.Index)
	if !target.CanSet() {
		return nil
	}

	switch target.Kind() {
	case reflect.String:
		s, ok := raw.(string)
		if !ok {
			return nil
		}
		target.SetString(s)
	case reflect.Bool:
		b, ok := raw.(bool)
		if ok {
			target.SetBool(b)
		}
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		fv, err := toNumber(raw)
		if err != nil {
			return nil
		}
		target.SetInt(int64(fv))
	case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
		fv, err := toNumber(raw)
		if err != nil {
			return nil
		}
		target.SetUint(uint64(fv))
	case reflect.Float32, reflect.Float64:
		fv, err := toNumber(raw)
		if err != nil {
			return nil
		}
		target.SetFloat(fv)
	default:
		// time.Time ou outros — tentamos decodificar.
		b, err := json.Marshal(raw)
		if err != nil {
			return nil
		}
		if field.Type == reflect.TypeOf(time.Time{}) {
			s, ok := raw.(string)
			if !ok {
				return nil
			}
			if err := target.Addr().Interface().(*time.Time).UnmarshalJSON(b); err != nil {
				if t, err := time.Parse(time.RFC3339, s); err == nil {
					target.Set(reflect.ValueOf(t))
				}
			}
			return nil
		}
		_ = json.Unmarshal(b, target.Addr().Interface())
	}
	return nil
}

func toNumber(v interface{}) (float64, error) {
	switch n := v.(type) {
	case float64:
		return n, nil
	case int:
		return float64(n), nil
	case int64:
		return float64(n), nil
	case json.Number:
		return n.Float64()
	case string:
		return strconv.ParseFloat(n, 64)
	}
	return 0, fmt.Errorf("not a number")
}

// populateFromPayload preenche o struct a partir do payload JSON, respeitando
// campos imutáveis (id, timestamps) e campos ocultos. isUpdate=true ignora
// campos ausentes do payload.
func populateFromPayload(v *reflect.Value, mc *RegisteredCollection, payload map[string]json.RawMessage, isUpdate bool) error {
	t := v.Type()

	for _, fm := range mc.Meta.Fields {
		if fm.Immutable {
			continue
		}
		raw, ok := payload[fm.Key]
		if !ok {
			if isUpdate {
				continue
			}
			if fm.CreatedAuto {
				continue
			}
			continue
		}
		// Decodificar o valor.
		var decoded interface{}
		dec := json.NewDecoder(strings.NewReader(string(raw)))
		dec.UseNumber()
		if err := dec.Decode(&decoded); err != nil {
			return fmt.Errorf("invalid value for %q", fm.Key)
		}
		field, ok := fieldIndex(t, fm.Key)
		if !ok {
			continue
		}
		if err := setField(*v, field, decoded); err != nil {
			return err
		}
	}
	return nil
}

// HandleStats: GET /api/admin/stats — contagem de registros por collection p/ dashboard.
func HandleStats() gin.HandlerFunc {
	return func(c *gin.Context) {
		out := map[string]int64{}
		for _, mc := range registry {
			var count int64
			dbFrom(c).Model(reflect.New(mc.ModelType).Interface()).Count(&count)
			out[mc.Meta.Name] = count
		}
		c.JSON(http.StatusOK, out)
	}
}
