using System.Net.Http;

namespace MedicalApp.Services
{
    public class MlClassifyResponse
    {
        public string ResearchType { get; set; } = string.Empty;
        public string ExtractedText { get; set; } = string.Empty;
        public string Confidence { get; set; } = string.Empty;
    }

    public class MlStatusResponse
    {
        public bool Online { get; set; }
        public bool HasModel { get; set; }
    }

    public class MlService : BaseApiService
    {
        
        private readonly HttpClient _mlHttpClient;

        public MlService()
        {
            _mlHttpClient = new HttpClient
            {
                BaseAddress = new Uri("http://localhost:3000/api/"),
                Timeout = TimeSpan.FromSeconds(120)
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
                new System.Net.Http.StringContent("{}", System.Text.Encoding.UTF8, "application/json")
            );

            if (!response.IsSuccessStatusCode) return null;

            var json = await response.Content.ReadAsStringAsync();
            return System.Text.Json.JsonSerializer.Deserialize<MlClassifyResponse>(json, _jsonOptions);
        }

        public async Task<MlStatusResponse?> GetStatusAsync() =>
            await GetAsync<MlStatusResponse>("ml/status");
    }
}