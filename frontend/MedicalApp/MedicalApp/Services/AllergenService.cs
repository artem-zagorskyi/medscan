namespace MedicalApp.Services
{
    public class AllergenItemResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
    }

    public class AllergenService : BaseApiService
    {
        public async Task<List<AllergenItemResponse>?> GetAllAsync() =>
            await GetAsync<List<AllergenItemResponse>>("allergens");

        public async Task<List<AllergenItemResponse>?> SearchAsync(string query) =>
            await GetAsync<List<AllergenItemResponse>>($"allergens/search?q={query}");
    }
}