using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MedicalApp.Services;

namespace MedicalApp.ViewModels
{
    public partial class NewDoctorViewModel : ObservableObject
    {
        private readonly AuthService _authService = new();

        public Action? OnSaved { get; set; }

        // --- Поля особи ---
        [ObservableProperty] private string _lastName = string.Empty;
        [ObservableProperty] private string _firstName = string.Empty;
        [ObservableProperty] private string _middleName = string.Empty;
        [ObservableProperty] private DateTime _birthDate = DateTime.Today;
        [ObservableProperty] private string _selectedGender = "MALE";
        [ObservableProperty] private string _contactInfo = string.Empty;

        // --- Поля акаунту ---
        [ObservableProperty] private string _email = string.Empty;
        [ObservableProperty] private string _password = string.Empty;
        [ObservableProperty] private string _specialization = string.Empty;

        // --- Стан ---
        [ObservableProperty] private bool _isSaving;

        private string _errorMessage = string.Empty;
        public string ErrorMessage
        {
            get => _errorMessage;
            set { SetProperty(ref _errorMessage, value); OnPropertyChanged(nameof(HasError)); }
        }
        public bool HasError => !string.IsNullOrEmpty(ErrorMessage);

        public List<string> GenderOptions { get; } = new() { "MALE", "FEMALE" };
        public List<string> GenderDisplayOptions { get; } = new() { "Чоловік", "Жінка" };

        [RelayCommand]
        private async Task SaveAsync()
        {
            if (string.IsNullOrWhiteSpace(LastName) || string.IsNullOrWhiteSpace(FirstName))
            {
                ErrorMessage = "Введіть прізвище та ім'я лікаря";
                return;
            }
            if (string.IsNullOrWhiteSpace(Email))
            {
                ErrorMessage = "Введіть email";
                return;
            }
            if (string.IsNullOrWhiteSpace(Password) || Password.Length < 6)
            {
                ErrorMessage = "Пароль має містити мінімум 6 символів";
                return;
            }
            if (string.IsNullOrWhiteSpace(Specialization))
            {
                ErrorMessage = "Введіть спеціалізацію";
                return;
            }

            try
            {
                IsSaving = true;
                ErrorMessage = string.Empty;

                await _authService.RegisterDoctorAsync(new RegisterDoctorRequest
                {
                    LastName = LastName.Trim(),
                    FirstName = FirstName.Trim(),
                    MiddleName = string.IsNullOrWhiteSpace(MiddleName) ? null : MiddleName.Trim(),
                    BirthDate = BirthDate.ToString("yyyy-MM-dd"),
                    Gender = SelectedGender,
                    ContactInfo = string.IsNullOrWhiteSpace(ContactInfo) ? null : ContactInfo.Trim(),
                    Role = "DOCTOR",
                    Email = Email.Trim(),
                    Password = Password,
                    Rights = "USER",
                    Specialization = Specialization.Trim()
                });

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