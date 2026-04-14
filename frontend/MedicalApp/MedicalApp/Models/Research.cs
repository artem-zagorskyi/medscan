using MedicalApp.Models.Enums;

namespace MedicalApp.Models
{
    public class Research
    {
        public int Id { get; set; }
        public int MedicalRecordId { get; set; }
        public string ResearchType { get; set; } = string.Empty;
        public ResearchStatus Status { get; set; }
        public string? ExtractedText { get; set; }
        public string? Results { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ProcessedAt { get; set; }

        public List<ResearchFile> ResearchFiles { get; set; } = [];
    }
}
