using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MedicalApp.Services;

namespace MedicalApp.ViewModels
{
    public partial class NewCaseViewModel : ObservableObject
    {
        private readonly CaseService _caseService = new();
        private readonly int _medicalRecordId;

        public Action<CaseResponse>? OnSaved { get; set; }

        public NewCaseViewModel(PatientDisplayModel patient, FullMedicalRecordResponse record)
        {
            _medicalRecordId = record.Id;
            PatientName = patient.FullName;
            OpeningDate = DateTime.Today;
        }

        public string PatientName { get; }

        private string _mainCondition = string.Empty;
        public string MainCondition
        {
            get => _mainCondition;
            set => SetProperty(ref _mainCondition, value);
        }

        private string _description = string.Empty;
        public string Description
        {
            get => _description;
            set => SetProperty(ref _description, value);
        }

        private DateTime _openingDate = DateTime.Today;
        public DateTime OpeningDate
        {
            get => _openingDate;
            set => SetProperty(ref _openingDate, value);
        }

        private string _errorMessage = string.Empty;
        public string ErrorMessage
        {
            get => _errorMessage;
            set
            {
                SetProperty(ref _errorMessage, value);
                OnPropertyChanged(nameof(HasError));
            }
        }

        public bool HasError => !string.IsNullOrEmpty(ErrorMessage);

        private bool _isSaving;
        public bool IsSaving
        {
            get => _isSaving;
            set => SetProperty(ref _isSaving, value);
        }

        [RelayCommand]
        private async Task SaveAsync()
        {
            if (string.IsNullOrWhiteSpace(MainCondition))
            {
                ErrorMessage = "Вкажіть назву або основний стан кейсу";
                return;
            }

            try
            {
                IsSaving = true;
                ErrorMessage = string.Empty;

                var created = await _caseService.CreateAsync(new CreateCaseRequest
                {
                    MedicalRecordId = _medicalRecordId,
                    MainCondition = MainCondition.Trim(),
                    Description = string.IsNullOrWhiteSpace(Description) ? null : Description.Trim(),
                    OpeningDate = OpeningDate.ToString("yyyy-MM-dd")
                });

                if (created != null)
                    OnSaved?.Invoke(created);
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