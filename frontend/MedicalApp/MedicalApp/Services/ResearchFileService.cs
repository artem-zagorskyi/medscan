namespace MedicalApp.Services
{
    public class ResearchFileService : BaseApiService
    {
        public async Task ClassifyAsync(int fileId, int researchId) =>
            await PatchAsync($"research-files/{fileId}/classify", new
            {
                research_id = researchId
            });
    }
}