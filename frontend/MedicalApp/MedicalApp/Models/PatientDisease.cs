using MedicalApp.Models.Enums;

namespace MedicalApp.Models
{
    public class PatientDisease
    {
        public int MedicalRecordId { get; set; }
        public int DiseaseId { get; set; }
        public DiseaseStatus Status { get; set; }
        public DateTime DiagnosedAt { get; set; }
        public Disease? Disease { get; set; }
    }
}
