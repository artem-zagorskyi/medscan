namespace MedicalApp.Services
{
    public class ResearchFileService : BaseApiService
    {
        public async Task ClassifyAsync(int fileId, int researchId) =>
            await PatchAsync($"research-files/{fileId}/classify", new
            {
                research_id = researchId
            });

        public async Task<byte[]> DownloadFileAsync(int fileId)
        {
            ApplyAuth();
            var response = await _httpClient.GetAsync($"research-files/{fileId}/download");
            await EnsureSuccessAsync(response);
            return await response.Content.ReadAsByteArrayAsync();
        }
    }
}