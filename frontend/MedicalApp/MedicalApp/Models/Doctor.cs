
namespace MedicalApp.Models
{
    public class Doctor
    {
        public int Id { get; set; }
        public int PersonId { get; set; }
        public string Specialization { get; set; } = string.Empty;
        public Person? Person { get; set; }
    }
}
