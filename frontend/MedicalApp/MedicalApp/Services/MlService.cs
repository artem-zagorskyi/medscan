using System.Net.Http;
using System.Text.Json;

namespace MedicalApp.Services
{
    
    public class MlCandidateModel
    {
        public string CommonName { get; set; } = string.Empty;
        public double Score { get; set; }
    }
    
    public class MlClassifyResponse
    {
        public string ClassifiedName { get; set; } = string.Empty;
        public string Confidence { get; set; } = string.Empty;
        public string Results { get; set; } = string.Empty;
        public string ExtractedText { get; set; } = string.Empty;
        public List<MlCandidateModel> Candidates { get; set; } = new();
    }

    // Відповідь від /api/ml/status
    public class MlStatusResponse
    {
        public bool Online { get; set; }
        public bool HasSlmModel { get; set; }
        public bool HasEmbeddingModel { get; set; }
        public bool IndexLoaded { get; set; }
        public int IndexSize { get; set; }
    }

    public class MlService : BaseApiService
    {
        private readonly HttpClient _mlHttpClient;

        public MlService()
        {
            // Окремий HttpClient з довшим таймаутом для ML-запитів
            _mlHttpClient = new HttpClient
            {
                BaseAddress = new Uri("http://localhost:3000/api/"),
                Timeout = TimeSpan.FromMinutes(10)
            };
        }

        public async Task<MlClassifyResponse?> ClassifyAsync(int fileId)
        {
            var token = Helpers.TokenStorage.Load();
            if (token != null)
                _mlHttpClient.DefaultRequestHeaders.Authorization =
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var response = await _mlHttpClient.PostAsync(
                $"ml/classify/{fileId}",
                new StringContent("{}", System.Text.Encoding.UTF8, "application/json")
            );

            if (!response.IsSuccessStatusCode) return null;

            var json = await response.Content.ReadAsStringAsync();

            
            var options = new System.Text.Json.JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            };
            return System.Text.Json.JsonSerializer.Deserialize<MlClassifyResponse>(json, options);
        }

        public async Task<MlStatusResponse?> GetStatusAsync() =>
            await GetAsync<MlStatusResponse>("ml/status");
    }
}