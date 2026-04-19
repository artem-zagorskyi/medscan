using MedicalApp.Helpers;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;

namespace MedicalApp.Services
{
    public class DoctorResponse
    {
        public int Id { get; set; }
        public int PersonId { get; set; }
        public string Specialization { get; set; } = string.Empty;
        public PersonResponse? Person { get; set; }
    }

    public class PersonResponse
    {
        public int Id { get; set; }
        public string LastName { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string? MiddleName { get; set; }
        public DateTime BirthDate { get; set; }
        public string Gender { get; set; } = string.Empty;
        public string FullName => $"{LastName} {FirstName} {MiddleName}".Trim();
    }

    public class DoctorService
    {
        private readonly HttpClient _httpClient;
        private readonly JsonSerializerOptions _jsonOptions;

        public DoctorService()
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

        public async Task<DoctorResponse?> GetByPersonIdAsync(int personId)
        {
            ApplyAuth();
            var response = await _httpClient.GetAsync($"doctors/person/{personId}");
            response.EnsureSuccessStatusCode();
            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<DoctorResponse>(json, _jsonOptions);
        }
    }
}
