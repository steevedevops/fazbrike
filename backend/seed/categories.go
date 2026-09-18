package seed

import (
	"fazbrike-backend/models"
	"log"

	"gorm.io/gorm"
)

type catSeed struct {
	Slug        string
	Name        string
	ListingType string
	SortOrder   int
	Icon        string
	Children    []catSeed
}

// SeedCategories inserts Marketplace-style categories if missing (idempotent by slug).
func SeedCategories(db *gorm.DB) error {
	seeds := []catSeed{
		{Slug: "veiculos", Name: "Veículos", ListingType: "vehicle", SortOrder: 10, Icon: "veiculos", Children: []catSeed{
			{Slug: "carros", Name: "Carros", ListingType: "vehicle", SortOrder: 1},
			{Slug: "motos", Name: "Motos", ListingType: "vehicle", SortOrder: 2},
			{Slug: "barcos", Name: "Barcos", ListingType: "vehicle", SortOrder: 3},
			{Slug: "outros-veiculos", Name: "Outros veículos", ListingType: "vehicle", SortOrder: 4},
		}},
		{Slug: "locacao-imoveis", Name: "Locação de imóveis", ListingType: "property", SortOrder: 20, Icon: "imoveis", Children: []catSeed{
			{Slug: "apartamento-aluguel", Name: "Apartamento", ListingType: "property", SortOrder: 1},
			{Slug: "casa-aluguel", Name: "Casa", ListingType: "property", SortOrder: 2},
			{Slug: "quarto-aluguel", Name: "Quarto", ListingType: "property", SortOrder: 3},
		}},
		{Slug: "imoveis", Name: "Venda de imóveis", ListingType: "property", SortOrder: 30, Icon: "imoveis", Children: []catSeed{
			{Slug: "apartamento-venda", Name: "Apartamento", ListingType: "property", SortOrder: 1},
			{Slug: "casa-venda", Name: "Casa", ListingType: "property", SortOrder: 2},
			{Slug: "terreno", Name: "Terreno", ListingType: "property", SortOrder: 3},
		}},
		{Slug: "eletronicos", Name: "Eletrônicos", ListingType: "item", SortOrder: 40, Icon: "eletronicos", Children: []catSeed{
			{Slug: "celulares", Name: "Celulares", ListingType: "item", SortOrder: 1},
			{Slug: "computadores", Name: "Computadores", ListingType: "item", SortOrder: 2},
			{Slug: "tvs-audio", Name: "TVs e áudio", ListingType: "item", SortOrder: 3},
			{Slug: "acessorios-eletronicos", Name: "Acessórios", ListingType: "item", SortOrder: 4},
		}},
		{Slug: "roupas", Name: "Roupas e acessórios", ListingType: "item", SortOrder: 50, Icon: "roupas", Children: []catSeed{
			{Slug: "roupas-masculinas", Name: "Masculino", ListingType: "item", SortOrder: 1},
			{Slug: "roupas-femininas", Name: "Feminino", ListingType: "item", SortOrder: 2},
			{Slug: "roupas-infantis", Name: "Infantil", ListingType: "item", SortOrder: 3},
			{Slug: "calcados", Name: "Calçados", ListingType: "item", SortOrder: 4},
		}},
		{Slug: "moveis", Name: "Móveis e casa", ListingType: "item", SortOrder: 60, Icon: "moveis"},
		{Slug: "eletrodomesticos", Name: "Eletrodomésticos", ListingType: "item", SortOrder: 70, Icon: "eletronicos"},
		{Slug: "jardinagem", Name: "Jardim e área externa", ListingType: "item", SortOrder: 80, Icon: "outros"},
		{Slug: "esportes", Name: "Artigos esportivos", ListingType: "item", SortOrder: 90, Icon: "esportes"},
		{Slug: "brinquedos", Name: "Brinquedos e jogos", ListingType: "item", SortOrder: 100, Icon: "outros"},
		{Slug: "familia", Name: "Família e bebê", ListingType: "item", SortOrder: 110, Icon: "outros"},
		{Slug: "hobbies", Name: "Hobbies", ListingType: "item", SortOrder: 120, Icon: "outros"},
		{Slug: "instrumentos-musicais", Name: "Instrumentos musicais", ListingType: "item", SortOrder: 130, Icon: "outros"},
		{Slug: "escritorio", Name: "Material de escritório", ListingType: "item", SortOrder: 140, Icon: "outros"},
		{Slug: "pets", Name: "Artigos para pets", ListingType: "item", SortOrder: 150, Icon: "outros"},
		{Slug: "entretenimento", Name: "Entretenimento", ListingType: "item", SortOrder: 160, Icon: "outros"},
		{Slug: "construcao", Name: "Melhorias para casa", ListingType: "item", SortOrder: 170, Icon: "outros"},
		{Slug: "pecas-auto", Name: "Peças automotivas", ListingType: "item", SortOrder: 180, Icon: "veiculos"},
		{Slug: "joias", Name: "Joias e relógios", ListingType: "item", SortOrder: 190, Icon: "outros"},
		{Slug: "beleza", Name: "Saúde e beleza", ListingType: "item", SortOrder: 200, Icon: "outros"},
		{Slug: "antiguidades", Name: "Antiguidades e colecionáveis", ListingType: "item", SortOrder: 210, Icon: "outros"},
		{Slug: "artesanato", Name: "Artes e artesanato", ListingType: "item", SortOrder: 220, Icon: "outros"},
		{Slug: "classificados", Name: "Classificados", ListingType: "item", SortOrder: 230, Icon: "outros"},
		{Slug: "gratis", Name: "Itens grátis", ListingType: "item", SortOrder: 240, Icon: "outros"},
		{Slug: "outros", Name: "Outros", ListingType: "item", SortOrder: 999, Icon: "outros"},
	}

	for _, s := range seeds {
		if err := upsertCategory(db, s, nil); err != nil {
			return err
		}
	}
	log.Printf("seed: categories ready (%d top-level)", len(seeds))
	return nil
}

func upsertCategory(db *gorm.DB, s catSeed, parentID *uint) error {
	var existing models.Category
	err := db.Where("slug = ?", s.Slug).First(&existing).Error
	if err == gorm.ErrRecordNotFound {
		c := models.Category{
			Slug:        s.Slug,
			Name:        s.Name,
			ListingType: s.ListingType,
			ParentID:    parentID,
			SortOrder:   s.SortOrder,
			IsActive:    true,
			Icon:        s.Icon,
		}
		if err := db.Create(&c).Error; err != nil {
			return err
		}
		existing = c
	} else if err != nil {
		return err
	} else {
		// Keep admin edits; only fill empty icon / fix parent if unset
		updates := map[string]interface{}{}
		if existing.Name == "" {
			updates["name"] = s.Name
		}
		if existing.ListingType == "" {
			updates["listing_type"] = s.ListingType
		}
		if existing.Icon == "" && s.Icon != "" {
			updates["icon"] = s.Icon
		}
		if len(updates) > 0 {
			if err := db.Model(&existing).Updates(updates).Error; err != nil {
				return err
			}
		}
	}
	id := existing.ID
	for _, child := range s.Children {
		if err := upsertCategory(db, child, &id); err != nil {
			return err
		}
	}
	return nil
}
