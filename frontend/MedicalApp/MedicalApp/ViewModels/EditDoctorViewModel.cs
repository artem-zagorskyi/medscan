using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MedicalApp.Services;

namespace MedicalApp.ViewModels
{
    public partial class EditDoctorViewModel : ObservableObject
    {
        private readonly DoctorService _doctorService = new();
        private readonly PersonService _personService = new();
        private readonly DoctorDisplayModel _doctor;

        public Action? OnSaved { get; set; }

        [ObservableProperty] private string _specialization = string.Empty;
        [ObservableProperty] private string _contactInfo = string.Empty;
        [ObservableProperty] private bool _isSaving;

        private string _errorMessage = string.Empty;
        public string ErrorMessage
        {
            get => _errorMessage;
            set { SetProperty(ref _errorMessage, value); OnPropertyChanged(nameof(HasError)); }
        }
        public bool HasError => !string.IsNullOrEmpty(ErrorMessage);

        public string DoctorName => _doctor.FullName;

        public EditDoctorViewModel(DoctorDisplayModel doctor)
        {
            _doctor = doctor;
            Specialization = doctor.Specialization;
            ContactInfo = doctor.ContactInfo;
        }

        [RelayCommand]
        private async Task SaveAsync()
        {
            if (string.IsNullOrWhiteSpace(Specialization))
            {
                ErrorMessage = "Введіть спеціалізацію";
                return;
            }

            try
            {
                IsSaving = true;
                ErrorMessage = string.Empty;

                await _doctorService.UpdateAsync(_doctor.Id, new UpdateDoctorRequest
                {
                    Specialization = Specialization.Trim()
                });

                await _personService.UpdateAsync(_doctor.PersonId, new UpdatePersonRequest
                {
                    ContactInfo = string.IsNullOrWhiteSpace(ContactInfo) ? null : ContactInfo.Trim()
                });

                // Оновлюємо локально
                _doctor.Specialization = Specialization.Trim();
                _doctor.ContactInfo = string.IsNullOrWhiteSpace(ContactInfo) ? "—" : ContactInfo.Trim();

                OnSaved?.Invoke();
            }
            catch (ApiException ex)
            {
                ErrorMessage = ex.Message;
            }
            catch (Exception ex)
            {
                ErrorMessage = $"Помилка: {ex.Message}";
            }
            finally
            {
                IsSaving = false;
            }
        }
    }
}