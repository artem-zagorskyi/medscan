using MedicalApp.Helpers;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;

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

    public class MedicalRecordService
    {
        private readonly HttpClient _httpClient;
        private readonly JsonSerializerOptions _jsonOptions;

        public MedicalRecordService()
        {
            _httpClient = new HttpClient
            {
                BaseAddress = new Uri("http://localhost:3000/api/")
            };

            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
                PropertyNameCaseInsensitive = true
            };
        }

        private void ApplyAuth()
        {
            var token = TokenStorage.Load();
            if (token != null)
                _httpClient.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", token);
        }

        public async Task<FullMedicalRecordResponse?> GetFullRecordAsync(int medicalRecordId)
        {
            ApplyAuth();
            var response = await _httpClient.GetAsync($"medical-records/{medicalRecordId}/full");
            response.EnsureSuccessStatusCode();
            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<FullMedicalRecordResponse>(json, _jsonOptions);
        }
    }
}