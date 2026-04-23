using MedicalApp.Helpers;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace MedicalApp.Services
{
    public class AuthService : BaseApiService
    {
        public async Task<LoginResponse?> LoginAsync(string email, string password)
        {
            var body = new { email, password };
            var content = new StringContent(
                JsonSerializer.Serialize(body, _jsonOptions),
                Encoding.UTF8,
                "application/json"
            );

            var response = await _httpClient.PostAsync("auth/login", content);
            await EnsureLoginAsync(response);

            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<LoginResponse>(json, _jsonOptions);

            if (result?.Token != null)
                TokenStorage.Save(result.Token);

            return result;
        }

        public async Task<MeResponse?> GetMeAsync()
        {
            return await GetAsync<MeResponse>("auth/me");
        }

        public void Logout() => TokenStorage.Clear();

        private async Task EnsureLoginAsync(HttpResponseMessage response)
        {
            if (response.IsSuccessStatusCode) return;

            throw response.StatusCode switch
            {
                System.Net.HttpStatusCode.Unauthorized =>
                    new ApiException("Невірний email або пароль", 401),
                System.Net.HttpStatusCode.InternalServerError =>
                    new ApiException("Помилка сервера. Перевірте підключення.", 500),
                _ => new ApiException("Помилка авторизації", (int)response.StatusCode)
            };
        }
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