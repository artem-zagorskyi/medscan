namespace MedicalApp.Services
{
    public class CreateRecordRequest
    {
        public int MedicalRecordId { get; set; }
        public int CaseId { get; set; }
        public int AuthorId { get; set; }
        public int? ParentRecordId { get; set; }
        public string VisitDate { get; set; } = string.Empty;
        public string Type { get; set; } = "EXAM";
        public string Status { get; set; } = "SIGNED";
        public string? Complaints { get; set; }
        public string? HistoryOfIllness { get; set; }
        public string? HistoryOfLife { get; set; }
        public string? SocialHabits { get; set; }
        public string? GeneralCondition { get; set; }
        public string? SkinStatus { get; set; }
        public string? RespiratorySystem { get; set; }
        public string? Cardiovascular { get; set; }
        public string? DoctorConclusion { get; set; }
        public string? TreatmentPlan { get; set; }
        public decimal? Temperature { get; set; }
        public string? BloodPressure { get; set; }
        public int? HeartRate { get; set; }
        public int? Spo2 { get; set; }
        public decimal? Weight { get; set; }
        public decimal? Height { get; set; }
    }

    public class RecordService : BaseApiService
    {
        public async Task<RecordResponse?> CreateAsync(CreateRecordRequest request) =>
        await PostAsync<RecordResponse>("records", new
        {
            medical_record_id = request.MedicalRecordId,
            case_id = request.CaseId,
            author_id = request.AuthorId,
            parent_record_id = request.ParentRecordId,
            visit_date = request.VisitDate,
            type = request.Type,
            status = request.Status,
            complaints = request.Complaints,
            history_of_illness = request.HistoryOfIllness,
            history_of_life = request.HistoryOfLife,
            social_habits = request.SocialHabits,
            general_condition = request.GeneralCondition,
            skin_status = request.SkinStatus,
            respiratory_system = request.RespiratorySystem,
            cardiovascular = request.Cardiovascular,
            doctor_conclusion = request.DoctorConclusion,
            treatment_plan = request.TreatmentPlan,
            temperature = request.Temperature,
            blood_pressure = request.BloodPressure,
            heart_rate = request.HeartRate,
            spo2 = request.Spo2,
            weight = request.Weight,
            height = request.Height,
        });

        public async Task<RecordResponse?> GetByIdAsync(int id) =>
            await GetAsync<RecordResponse>($"records/{id}");

        public async Task<List<RecordResponse>?> GetByMedicalRecordAsync(int medicalRecordId) =>
            await GetAsync<List<RecordResponse>>($"records/medical-record/{medicalRecordId}");

        public async Task<List<RecordResponse>?> GetByCaseAsync(int caseId) =>
            await GetAsync<List<RecordResponse>>($"records/case/{caseId}");

        public async Task SignAsync(int id) =>
            await PatchAsync($"records/{id}/sign", new { });

        public async Task DeleteAsync(int id) =>
            await DeleteAsync($"records/{id}");

        public async Task<RecordResponse?> UpdateAsync(int id, CreateRecordRequest request) =>
        await PatchAsync<RecordResponse>($"records/{id}", new
        {
            visit_date = request.VisitDate,
            type = request.Type,
            status = request.Status,
            complaints = request.Complaints,
            history_of_illness = request.HistoryOfIllness,
            history_of_life = request.HistoryOfLife,
            social_habits = request.SocialHabits,
            general_condition = request.GeneralCondition,
            skin_status = request.SkinStatus,
            respiratory_system = request.RespiratorySystem,
            cardiovascular = request.Cardiovascular,
            doctor_conclusion = request.DoctorConclusion,
            treatment_plan = request.TreatmentPlan,
            temperature = request.Temperature,
            blood_pressure = request.BloodPressure,
            heart_rate = request.HeartRate,
            spo2 = request.Spo2,
            weight = request.Weight,
            height = request.Height,
        });
    }
}