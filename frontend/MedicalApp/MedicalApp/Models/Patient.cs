
namespace MedicalApp.Models
{
    public class Patient
    {
        public int Id { get; set; }
        public int PersonId { get; set; }
        public int MedicalRecordId { get; set; }
        public Person? Person { get; set; }
        public MedicalRecord? MedicalRecord { get; set; }
    }
}
