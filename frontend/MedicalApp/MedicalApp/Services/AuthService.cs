using MedicalApp.Helpers;
using MedicalApp.Models;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace MedicalApp.Services
{

    public class AuthService
    {
        private readonly HttpClient _httpClient;
        private readonly JsonSerializerOptions _jsonOptions;

        public AuthService()
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

        public async Task<LoginResponse?> LoginAsync(string email, string password)
        {
            var body = new { email, password };
            var content = new StringContent(
                JsonSerializer.Serialize(body, _jsonOptions),
                Encoding.UTF8,
                "application/json"
            );

            var response = await _httpClient.PostAsync("auth/login", content);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<LoginResponse>(json, _jsonOptions);

            if (result?.Token != null)
                TokenStorage.Save(result.Token);

            return result;
        }

        public async Task<MeResponse?> GetMeAsync()
        {
            var token = TokenStorage.Load();
            if (token == null) return null;

            _httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);

            var response = await _httpClient.GetAsync("auth/me");
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<MeResponse>(json, _jsonOptions);
        }

        public void Logout() => TokenStorage.Clear();
    }

    public class LoginResponse
    {
        public string Token { get; set; } = string.Empty;
        public int AccountId { get; set; }
        public int PersonId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Rights { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }

    public class MeResponse
    {
        public int Id { get; set; }
        public int PersonId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Rights { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }
}
