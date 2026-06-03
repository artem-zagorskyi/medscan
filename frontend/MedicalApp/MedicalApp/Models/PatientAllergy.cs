using MedicalApp.Models.Enums;

namespace MedicalApp.Models
{
    public class PatientAllergy
    {
        public int MedicalRecordId { get; set; }
        public int AllergenId { get; set; }
        public AllergyReactionSeverity ReactionSeverity { get; set; }
        public string? ReactionDescription { get; set; }
        public DateTime DiagnosedAt { get; set; }
        public Allergen? Allergen { get; set; }
    }
}
