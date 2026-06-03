namespace MedicalApp.Services
{
    public class MedicationItemResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Form { get; set; }
        public string? ActiveSubstance { get; set; }
        public string? DosageUnit { get; set; }
        public string DisplayName => string.IsNullOrEmpty(Form)
            ? Name
            : $"{Name} ({Form})";
    }

    public class MedicationService : BaseApiService
    {
        public async Task<List<MedicationItemResponse>?> GetAllAsync() =>
            await GetAsync<List<MedicationItemResponse>>("medications");

        public async Task<List<MedicationItemResponse>?> SearchAsync(string query) =>
            await GetAsync<List<MedicationItemResponse>>($"medications/search?q={Uri.EscapeDataString(query)}");
    }
}