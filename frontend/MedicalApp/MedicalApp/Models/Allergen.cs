using MedicalApp.Models.Enums;

namespace MedicalApp.Models
{
    public class Allergen
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public AllergenCategory Category { get; set; }
    }
}
