using MedicalApp.Models.Enums;

namespace MedicalApp.Models
{
    public class Record
    {
        public int Id { get; set; }
        public int MedicalRecordId { get; set; }
        public int DoctorId { get; set; }
        public DateTime VisitDate { get; set; }
        public EntryType EntryType { get; set; }
        public string? Complaints { get; set; }
        public string? DoctorConclusion { get; set; }
        public string? TreatmentPlan { get; set; }
        public string? PlanText { get; set; }
        public int? ResearchId { get; set; }
        public Doctor? Doctor { get; set; }
        public Research? Research { get; set; }
    }
}
