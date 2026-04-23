namespace MedicalApp.Services
{
    public class CreateRecordRequest
    {
        public int MedicalRecordId { get; set; }
        public int DoctorId { get; set; }
        public string VisitDate { get; set; } = string.Empty;
        public string EntryType { get; set; } = string.Empty;
        public string? Complaints { get; set; }
        public string? DoctorConclusion { get; set; }
        public string? TreatmentPlan { get; set; }
        public int? ResearchId { get; set; }
    }

    public class RecordService : BaseApiService
    {
        public async Task<RecordResponse?> CreateAsync(CreateRecordRequest request) =>
            await PostAsync<RecordResponse>("records", new
            {
                medical_record_id = request.MedicalRecordId,
                doctor_id = request.DoctorId,
                visit_date = request.VisitDate,
                entry_type = request.EntryType,
                complaints = request.Complaints,
                doctor_conclusion = request.DoctorConclusion,
                treatment_plan = request.TreatmentPlan,
                research_id = request.ResearchId
            });

        public async Task<List<RecordResponse>?> GetByMedicalRecordAsync(int medicalRecordId) =>
            await GetAsync<List<RecordResponse>>($"records/medical-record/{medicalRecordId}");
    }
}