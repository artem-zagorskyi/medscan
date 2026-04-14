using MedicalApp.Models.Enums;

namespace MedicalApp.Models
{
    public class MedicalRecord
    {
        public int Id { get; set; }
        public BloodGroup? BloodGroup { get; set; }
        public RhFactor? RhFactor { get; set; }
        public DateTime CreatedAt { get; set; }

        public List<Record> Records { get; set; } = [];
        public List<Research> Researches { get; set; } = [];
        public List<PatientDisease> PatientDiseases { get; set; } = [];
        public List<PatientAllergy> PatientAllergies { get; set; } = [];
    }
}
