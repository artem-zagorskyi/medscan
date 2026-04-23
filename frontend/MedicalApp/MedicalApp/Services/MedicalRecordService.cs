namespace MedicalApp.Services
{
    public class FullMedicalRecordResponse
    {
        public int Id { get; set; }
        public string? BloodGroup { get; set; }
        public string? RhFactor { get; set; }
        public List<RecordResponse> Records { get; set; } = new();
        public List<PatientDiseaseResponse> PatientDiseases { get; set; } = new();
        public List<PatientAllergyResponse> PatientAllergies { get; set; } = new();
    }

    public class RecordResponse
    {
        public int Id { get; set; }
        public DateTime VisitDate { get; set; }
        public string EntryType { get; set; } = string.Empty;
        public string? Complaints { get; set; }
        public string? DoctorConclusion { get; set; }
        public string? TreatmentPlan { get; set; }
        public DoctorInRecordResponse? Doctor { get; set; }
        public ResearchInRecordResponse? Research { get; set; }
    }

    public class DoctorInRecordResponse
    {
        public int Id { get; set; }
        public string Specialization { get; set; } = string.Empty;
        public PersonResponse? Person { get; set; }
        public string FullName => Person?.FullName ?? string.Empty;
    }

    public class ResearchInRecordResponse
    {
        public int Id { get; set; }
        public string ResearchType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }

    public class PatientDiseaseResponse
    {
        public string Status { get; set; } = string.Empty;
        public DateTime DiagnosedAt { get; set; }
        public DiseaseResponse? Disease { get; set; }
    }

    public class DiseaseResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string IcdCode { get; set; } = string.Empty;
    }

    public class PatientAllergyResponse
    {
        public string ReactionSeverity { get; set; } = string.Empty;
        public string? ReactionDescription { get; set; }
        public AllergenResponse? Allergen { get; set; }
    }

    public class AllergenResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
    }

    public class MedicalRecordService : BaseApiService
    {
        public async Task<FullMedicalRecordResponse?> GetFullRecordAsync(int medicalRecordId) =>
            await GetAsync<FullMedicalRecordResponse>($"medical-records/{medicalRecordId}/full");

        public async Task UpdateBloodInfoAsync(int medicalRecordId, string? bloodGroup, string? rhFactor) =>
            await PatchAsync($"medical-records/{medicalRecordId}/blood-info", new
            {
                blood_group = bloodGroup,
                rh_factor = rhFactor
            });
    }
}