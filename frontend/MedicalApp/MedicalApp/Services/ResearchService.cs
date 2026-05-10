namespace MedicalApp.Services
{
    public class ResearchItemResponse
    {
        public int Id { get; set; }
        public int MedicalRecordId { get; set; }
        public string ResearchType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? Results { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ProcessedAt { get; set; }
    }

    public class CreateResearchRequest
    {
        public int MedicalRecordId { get; set; }
        public string ResearchType { get; set; } = string.Empty;
        public int? CaseId { get; set; }
        public string? Results { get; set; }
        public string Status { get; set; } = "PROCESSED";
    }

    public class ResearchService : BaseApiService
    {
        public async Task<ResearchItemResponse?> CreateAsync(CreateResearchRequest request) =>
            await PostAsync<ResearchItemResponse>("researches", new
            {
                medical_record_id = request.MedicalRecordId,
                research_type = request.ResearchType,
                case_id = request.CaseId,
                results = request.Results,
                status = request.Status
            });

        public async Task<List<ResearchItemResponse>?> GetByMedicalRecordAsync(int medicalRecordId) =>
            await GetAsync<List<ResearchItemResponse>>($"researches/medical-record/{medicalRecordId}");

        public async Task UpdateStatusAsync(int id, string status) =>
            await PatchAsync($"researches/{id}/status", new { status });
    }
}