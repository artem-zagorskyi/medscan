using MedicalApp.Helpers;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;

namespace MedicalApp.Services
{
    public abstract class BaseApiService
    {
        protected readonly HttpClient _httpClient;
        protected readonly JsonSerializerOptions _jsonOptions;

        protected BaseApiService()
        {
            _httpClient = new HttpClient
            {
                BaseAddress = new Uri("http://localhost:3000/api/"),
                Timeout = TimeSpan.FromSeconds(15)
            };

            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
                PropertyNameCaseInsensitive = true
            };
        }

        protected void ApplyAuth()
        {
            var token = TokenStorage.Load();
            if (token != null)
                _httpClient.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", token);
        }

        protected async Task<T?> GetAsync<T>(string url)
        {
            ApplyAuth();
            var response = await _httpClient.GetAsync(url);
            await EnsureSuccessAsync(response);
            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<T>(json, _jsonOptions);
        }

        protected async Task<T?> PostAsync<T>(string url, object body)
        {
            ApplyAuth();
            var content = ToJson(body);
            var response = await _httpClient.PostAsync(url, content);
            await EnsureSuccessAsync(response);
            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<T>(json, _jsonOptions);
        }

        protected async Task PostAsync(string url, object body)
        {
            ApplyAuth();
            var content = ToJson(body);
            var response = await _httpClient.PostAsync(url, content);
            await EnsureSuccessAsync(response);
        }

        protected async Task PatchAsync(string url, object body)
        {
            ApplyAuth();
            var content = ToJson(body);
            var response = await _httpClient.PatchAsync(url, content);
            await EnsureSuccessAsync(response);
        }

        protected async Task DeleteAsync(string url)
        {
            ApplyAuth();
            var response = await _httpClient.DeleteAsync(url);
            await EnsureSuccessAsync(response);
        }

        private System.Net.Http.StringContent ToJson(object body) =>
            new(JsonSerializer.Serialize(body, _jsonOptions),
                System.Text.Encoding.UTF8,
                "application/json");

        private async Task EnsureSuccessAsync(HttpResponseMessage response)
        {
            if (response.IsSuccessStatusCode) return;

            string message;
            try
            {
                var json = await response.Content.ReadAsStringAsync();
                var error = JsonSerializer.Deserialize<ApiErrorResponse>(json, _jsonOptions);
                message = error?.Message ?? response.ReasonPhrase ?? "Невідома помилка";
            }
            catch
            {
                message = response.ReasonPhrase ?? "Невідома помилка";
            }

            throw response.StatusCode switch
            {
                System.Net.HttpStatusCode.Unauthorized =>
                    new ApiException("Невірний email або пароль", 401),
                System.Net.HttpStatusCode.Forbidden =>
                    new ApiException("Доступ заборонено", 403),
                System.Net.HttpStatusCode.NotFound =>
                    new ApiException($"Не знайдено: {message}", 404),
                System.Net.HttpStatusCode.InternalServerError =>
                    new ApiException("Помилка сервера. Спробуйте пізніше.", 500),
                _ => new ApiException($"Помилка: {message}", (int)response.StatusCode)
            };
        }
    }

    public class ApiErrorResponse
    {
        public string Message { get; set; } = string.Empty;
    }

    public class ApiException : Exception
    {
        public int StatusCode { get; }

        public ApiException(string message, int statusCode) : base(message)
        {
            StatusCode = statusCode;
        }
    }
}