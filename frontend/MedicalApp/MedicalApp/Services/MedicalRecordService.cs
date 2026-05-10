namespace MedicalApp.Services
{
    // --- Full Medical Record ---
    public class FullMedicalRecordResponse
    {
        public int Id { get; set; }
        public string? BloodGroup { get; set; }
        public string? RhFactor { get; set; }
        public string? Height { get; set; }
        public string? Weight { get; set; }
        public List<CaseResponse> Cases { get; set; } = new();
        public List<PatientDiseaseResponse> PatientDiseases { get; set; } = new();
        public List<PatientAllergyResponse> PatientAllergies { get; set; } = new();
        public List<ResearchResponse> Researches { get; set; } = new();
        public List<ResearchFileResponse> ResearchFiles { get; set; } = new();
        public PatientInRecordResponse? Patient { get; set; }
    }

    public class PatientInRecordResponse
    {
        public int Id { get; set; }
        public string? Address { get; set; }
        public PersonResponse? Person { get; set; }
    }

    // --- Record ---
    public class RecordResponse
    {
        public int Id { get; set; }
        public int MedicalRecordId { get; set; }
        public int CaseId { get; set; }
        public DateTime VisitDate { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;

        // Анамнез
        public string? Complaints { get; set; }
        public string? HistoryOfIllness { get; set; }
        public string? HistoryOfLife { get; set; }
        public string? SocialHabits { get; set; }

        // Вітальні показники
        public string? Height { get; set; }
        public string? Weight { get; set; }
        public string? Temperature { get; set; }
        public string? BloodPressure { get; set; }
        public int? HeartRate { get; set; }
        public int? Spo2 { get; set; }

        // Об'єктивний статус
        public string? GeneralCondition { get; set; }
        public string? SkinStatus { get; set; }
        public string? RespiratorySystem { get; set; }
        public string? Cardiovascular { get; set; }

        // Висновок
        public string? DoctorConclusion { get; set; }
        public string? TreatmentPlan { get; set; }

        public DoctorInRecordResponse? Author { get; set; }
        public List<RecordDiagnosisResponse> RecordDiagnoses { get; set; } = new();
        public List<RecordMedicationResponse> RecordMedications { get; set; } = new();
        public List<RecordResearchResponse> RecordResearches { get; set; } = new();
        public List<RecordAllergyResponse> RecordAllergies { get; set; } = new();
        public List<RecordDoctorResponse> RecordDoctors { get; set; } = new();

        public string VisitDateDisplay => VisitDate.ToString("dd.MM.yyyy");
        public string TypeDisplay => Type switch
        {
            "EXAM" => "Огляд",
            "CONSILIUM" => "Консиліум",
            "EPICRISIS" => "Епікриз",
            _ => "—"
        };
        public string StatusDisplay => Status == "SIGNED" ? "Підписано" : "Чернетка";
        public bool IsSigned => Status == "SIGNED";
    }

    public class DoctorInRecordResponse
    {
        public int Id { get; set; }
        public string Specialization { get; set; } = string.Empty;
        public PersonResponse? Person { get; set; }
        public string FullName => Person != null
            ? $"{Person.LastName} {Person.FirstName?[0]}. {Person.MiddleName?[0]}."
            : "—";
    }

    // --- Record sub-models ---
    public class RecordDiagnosisResponse
    {
        public int Id { get; set; }
        public int RecordId { get; set; }
        public bool IsFinal { get; set; }
        public bool IsMain { get; set; }
        public string? Description { get; set; }
        public DiseaseResponse? Disease { get; set; }
    }

    public class RecordMedicationResponse
    {
        public int Id { get; set; }
        public int RecordId { get; set; }
        public string? Dosage { get; set; }
        public string? Frequency { get; set; }
        public string? Duration { get; set; }
        public string? Comment { get; set; }
        public MedicationResponse? Medication { get; set; }
    }

    public class MedicationResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Form { get; set; }
        public string? ActiveSubstance { get; set; }
        public string? DosageUnit { get; set; }
    }

    public class RecordResearchResponse
    {
        public int Id { get; set; }
        public int RecordId { get; set; }
        public ResearchResponse? Research { get; set; }
    }

    public class RecordAllergyResponse
    {
        public int Id { get; set; }
        public int RecordId { get; set; }
        public string ReactionSeverity { get; set; } = string.Empty;
        public string? ReactionDescription { get; set; }
        public AllergenResponse? Allergen { get; set; }
        public string AllergyDisplay => $"{Allergen?.Name} · {ReactionSeverity switch { "SEVERE" => "Важка", "MODERATE" => "Помірна", _ => "Легка" }}";
    }

    public class RecordDoctorResponse
    {
        public int Id { get; set; }
        public int RecordId { get; set; }
        public string Role { get; set; } = string.Empty;
        public DoctorInRecordResponse? Doctor { get; set; }
    }

    // --- Research ---
    public class ResearchResponse
    {
        public int Id { get; set; }
        public int MedicalRecordId { get; set; }
        public int? CaseId { get; set; }
        public string ResearchType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? Results { get; set; }
        public string? ExtractedText { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ProcessedAt { get; set; }

        public string StatusDisplay => Status switch
        {
            "PENDING" => "Очікує",
            "PROCESSING" => "Обробляється",
            "PROCESSED" => "Оброблено",
            "ERROR" => "Помилка",
            _ => "—"
        };
        public string CreatedAtDisplay => CreatedAt.ToString("dd.MM.yyyy");
    }

    // --- Research File ---
    public class ResearchFileResponse
    {
        public int Id { get; set; }
        public int MedicalRecordId { get; set; }
        public int? ResearchId { get; set; }
        public string FilePath { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }

        public string StatusDisplay => Status switch
        {
            "PENDING" => "Очікує",
            "PROCESSED" => "Оброблено",
            "ERROR" => "Помилка",
            _ => "—"
        };
    }

    // --- Patient Disease / Allergy ---
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

    // --- Services ---
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

        public async Task UpdatePhysicalInfoAsync(int medicalRecordId, decimal? height, decimal? weight) =>
            await PatchAsync($"medical-records/{medicalRecordId}/physical-info", new
            {
                height,
                weight
            });
    }
}