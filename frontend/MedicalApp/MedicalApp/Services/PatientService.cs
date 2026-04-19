using MedicalApp.Helpers;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;

namespace MedicalApp.Services
{
    public class DoctorPatientResponse
    {
        public int PatientId { get; set; }
        public int DoctorId { get; set; }
        public PatientResponse? Patient { get; set; }
    }

    public class PatientResponse
    {
        public int Id { get; set; }
        public int PersonId { get; set; }
        public int MedicalRecordId { get; set; }
        public PersonResponse? Person { get; set; }
    }

    public class PatientService
    {
        private readonly HttpClient _httpClient;
        private readonly JsonSerializerOptions _jsonOptions;

        public PatientService()
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

        public async Task<List<DoctorPatientResponse>?> GetByDoctorIdAsync(int doctorId)
        {
            ApplyAuth();
            var response = await _httpClient.GetAsync($"patients/doctor/{doctorId}");
            response.EnsureSuccessStatusCode();
            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<List<DoctorPatientResponse>>(json, _jsonOptions);
        }
    }
}
