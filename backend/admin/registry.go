package admin

import (
	"fmt"
	"reflect"
	"sort"
	"strings"
	"time"
)

// FieldKind descreve como o campo deve ser renderizado/entendido.
type FieldKind string

const (
	KindText     FieldKind = "text"
	KindNumber   FieldKind = "number"
	KindBool     FieldKind = "bool"
	KindTime     FieldKind = "time"
	KindRelation FieldKind = "relation"
)

// FieldMeta descreve um único campo de uma collection.
type FieldMeta struct {
	Key          string    `json:"key"`
	Label        string    `json:"label"`
	Kind         FieldKind `json:"kind"`
	Required     bool      `json:"required"`
	Unique       bool      `json:"unique"`
	Immutable    bool      `json:"immutable"` // ex.: ID, timestamps — não editáveis
	CreatedAuto  bool      `json:"-"`         // gerado automaticamente no create
	HiddenInList bool      `json:"hidden_in_list"`
	HiddenInForm bool      `json:"hidden_in_form"`
	Editable     bool      `json:"editable"`
	Sortable     bool      `json:"sortable"`
}

// CollectionMeta descreve uma collection inteira (o "model" no admin).
type CollectionMeta struct {
	Name         string      `json:"name"`  // nome técnico (ex.: users)
	Label        string      `json:"label"` // rótulo amigável (ex.: Usuários)
	Fields       []FieldMeta `json:"fields"`
	Searchable   []string    `json:"searchable"` // chaves usadas na busca
	DefaultOrder []Order     `json:"default_order"`
}

// Order descreve uma ordenação padrão.
type Order struct {
	Field string `json:"field"`
	Desc  bool   `json:"desc"`
}

// RegisteredCollection relaciona os metadados de uma collection ao seu tipo Go.
type RegisteredCollection struct {
	Meta      CollectionMeta
	ModelType reflect.Type
}

var registry []*RegisteredCollection

// Register coleta automaticamente os metadados de um model (por reflection)
// e o adiciona ao registro do admin.
//
// Quando um módulo/model novo é criado no backend, basta chamar Register() com
// o ponteiro do tipo (ex.: Register(&models.User{})) dentro de InitAdmin() — o
// CRUD completo no admin fica disponível automaticamente. Ver skill
// .reasonix/skills/admin-module/SKILL.md.
func Register(model interface{}) error {
	t := reflect.TypeOf(model)
	if t.Kind() == reflect.Ptr {
		t = t.Elem()
	}
	if t.Kind() != reflect.Struct {
		return fmt.Errorf("admin: Register requires a struct, got %T", model)
	}

	pkg := t.PkgPath()
	// Nome da collection a partir do nome do tipo, em snake_case.
	name := snakeCase(t.Name())
	label := humanize(name)

	meta := CollectionMeta{
		Name:         name,
		Label:        label,
		Fields:       []FieldMeta{},
		DefaultOrder: []Order{{Field: "created_at", Desc: true}},
	}

	searchable := []string{}
	hasCreatedAt := false

	for i := 0; i < t.NumField(); i++ {
		f := t.Field(i)
		field := f.Name
		jsonTag := f.Tag.Get("json")
		if jsonTag != "" && jsonTag != "-" {
			field = strings.Split(jsonTag, ",")[0]
		}

		// Ignora campos de gerenciamento do GORM (DeletedAt, User embutido, etc.)
		if field == "" || strings.EqualFold(field, "deletedat") {
			continue
		}
		// Campos que apontam para structs aninhadas de relação propagam os campos do alvo,
		// mas o JSON de relação usa o ID. Mantemos apenas relações primitivas por enquanto.
		if jsonTag == "-" {
			continue
		}

		fm := FieldMeta{
			Key:      field,
			Label:    humanize(field),
			Editable: true,
			Sortable: true,
		}

		// Inferência do tipo.
		switch f.Type.Kind() {
		case reflect.String:
			fm.Kind = KindText
		case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64,
			reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64,
			reflect.Float32, reflect.Float64:
			fm.Kind = KindNumber
		case reflect.Bool:
			fm.Kind = KindBool
		case reflect.Slice:
			// byte slice (= imagem armazenada) — ocultamos da listagem.
			if f.Type.Elem().Kind() == reflect.Uint8 {
				fm.Kind = KindText
				fm.Editable = false
				fm.HiddenInList = true
				fm.HiddenInForm = true
			} else {
				continue
			}
		default:
			// time.Time ou tipos não-primitivos: tratamos de forma conservadora.
			if f.Type == reflect.TypeOf(time.Time{}) {
				fm.Kind = KindTime
				fm.Immutable = true
				fm.Editable = false
				fm.HiddenInForm = true
				if strings.EqualFold(field, "created_at") {
					fm.CreatedAuto = true
					hasCreatedAt = true
				}
			} else {
				// Outro struct/pointer (relação embutida): ocultamos da listagem e do form.
				fm.Editable = false
				fm.HiddenInList = true
				fm.HiddenInForm = true
				fm.Kind = KindRelation
			}
		}

		// Regras por campo conhecido.
		cfg := string(f.Tag.Get("gorm"))
		if strings.Contains(cfg, "primaryKey") {
			fm.Immutable = true
			fm.Editable = false
			fm.HiddenInForm = true
			fm.Label = "ID"
		}
		if strings.Contains(cfg, "uniqueIndex") {
			fm.Unique = true
		}
		if strings.Contains(cfg, "not null") {
			fm.Required = true
		}

		meta.Fields = append(meta.Fields, fm)

		// Campos de texto simples entram na busca.
		if fm.Kind == KindText && !fm.Immutable && len(field) <= 32 {
			searchable = append(searchable, field)
		}
	}

	// Se o model não expõe created_at, ordena por id desc como fallback.
	if !hasCreatedAt {
		meta.DefaultOrder = []Order{{Field: "id", Desc: true}}
	}

	// Evita registros duplicados.
	for _, r := range registry {
		if r.Meta.Name == name {
			return fmt.Errorf("admin: collection %q already registered", name)
		}
	}

	meta.Searchable = searchable
	_ = pkg

	registry = append(registry, &RegisteredCollection{Meta: meta, ModelType: t})

	return nil
}

// MetaResponse é a resposta de GET /api/admin/meta.
type MetaResponse struct {
	Collections []CollectionMeta `json:"collections"`
}

// GetMeta devolve os metadados de todas as collections registradas.
func GetMeta() MetaResponse {
	resp := MetaResponse{}
	for _, r := range registry {
		resp.Collections = append(resp.Collections, r.Meta)
	}
	return resp
}

// FindCollection busca uma collection registrada por nome.
func FindCollection(name string) *RegisteredCollection {
	for _, r := range registry {
		if r.Meta.Name == name {
			return r
		}
	}
	return nil
}

// ListedCollections retorna as collections ordenadas por label para a navegação.
func ListedCollections() []string {
	names := []string{}
	byName := map[string]*RegisteredCollection{}
	for _, r := range registry {
		names = append(names, r.Meta.Name)
		byName[r.Meta.Name] = r
	}
	sort.Slice(names, func(i, j int) bool {
		return byName[names[i]].Meta.Label < byName[names[j]].Meta.Label
	})
	return names
}

// DefaultSortFor devolve a ordenação padrão de uma collection.
func DefaultSortFor(c *RegisteredCollection) []Order {
	return c.Meta.DefaultOrder
}

// NewModelInstance cria uma nova instância zero do model de uma collection.
func NewModelInstance(c *RegisteredCollection) interface{} {
	return reflect.New(c.ModelType).Interface()
}

// ModelPrimaryKey devolve o nome da coluna de chave primária (via tag json).
func ModelPrimaryKey(c *RegisteredCollection) string {
	for _, f := range c.Meta.Fields {
		if strings.EqualFold(f.Label, "id") && strings.EqualFold(f.Key, "id") {
			return f.Key
		}
	}
	return "id"
}

// SetCollectionLabel substitui o rótulo amigável de uma collection já registrada
// (ex.: SetCollectionLabel("user", "Usuários")). Deve ser chamado após Register().
func SetCollectionLabel(name, label string) {
	for _, r := range registry {
		if r.Meta.Name == name {
			r.Meta.Label = label
			return
		}
	}
}

// snakeCase converte Name para snake_case (ex.: User -> user, MessageThread -> message_thread).
func snakeCase(s string) string {
	out := []rune{}
	for i, r := range s {
		if r >= 'A' && r <= 'Z' {
			if i > 0 {
				out = append(out, '_')
			}
			out = append(out, r+('a'-'A'))
		} else {
			out = append(out, r)
		}
	}
	return string(out)
}

// humanize converte "first_name"/"FirstName" em "First name".
func humanize(s string) string {
	s = strings.ReplaceAll(s, "_", " ")
	s = strings.ReplaceAll(s, "-", " ")
	s = strings.TrimSpace(s)
	if s == "" {
		return s
	}
	// capitalizar primeira letra.
	first := s[0]
	if first >= 'a' && first <= 'z' {
		first = first - ('a' - 'A')
	}
	return string(first) + s[1:]
}
