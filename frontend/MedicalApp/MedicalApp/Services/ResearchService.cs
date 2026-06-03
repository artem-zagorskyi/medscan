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
        public string? ExtractedText { get; set; }
    }

    public class UpdateResearchRequest
    {
        public string? Results { get; set; }
        public string? ExtractedText { get; set; }
        public string? Status { get; set; }
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
                extracted_text = request.ExtractedText,
                status = request.Status
            });

        public async Task<List<ResearchItemResponse>?> GetByMedicalRecordAsync(int medicalRecordId) =>
            await GetAsync<List<ResearchItemResponse>>($"researches/medical-record/{medicalRecordId}");

        public async Task UpdateStatusAsync(int id, string status) =>
            await PatchAsync($"researches/{id}/status", new { status });

        public async Task UpdateAsync(int id, UpdateResearchRequest request) =>
        await PatchAsync($"researches/{id}", new
        {
            results = request.Results,
            extracted_text = request.ExtractedText
        });

        
    }
}