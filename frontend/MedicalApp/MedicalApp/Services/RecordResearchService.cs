namespace MedicalApp.Services
{
    public class RecordResearchService : BaseApiService
    {
        public async Task AddAsync(int recordId, int researchId) =>
            await PostAsync("record-researches", new
            {
                record_id = recordId,
                research_id = researchId
            });

        public async Task RemoveAsync(int id) =>
            await DeleteAsync($"record-researches/{id}");
    }
}