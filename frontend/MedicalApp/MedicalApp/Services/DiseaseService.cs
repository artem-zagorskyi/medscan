namespace MedicalApp.Services
{
    public class DiseaseItemResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string IcdCode { get; set; } = string.Empty;
    }

    public class DiseaseService : BaseApiService
    {
        public async Task<List<DiseaseItemResponse>?> GetAllAsync() =>
            await GetAsync<List<DiseaseItemResponse>>("diseases");

        public async Task<List<DiseaseItemResponse>?> SearchAsync(string query) =>
            await GetAsync<List<DiseaseItemResponse>>($"diseases/search?q={query}");
    }
}