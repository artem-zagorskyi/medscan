using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MedicalApp.Services;
using System.Collections.ObjectModel;

namespace MedicalApp.ViewModels
{
    public partial class AdminDoctorsViewModel : ObservableObject
    {
        private readonly DoctorService _doctorService = new();
        private List<DoctorDisplayModel> _allDoctors = new();

        public AdminDoctorsViewModel()
        {
            _ = LoadAsync();
        }

        private bool _isLoading;
        public bool IsLoading
        {
            get => _isLoading;
            set => SetProperty(ref _isLoading, value);
        }

        private string _errorMessage = string.Empty;
        public string ErrorMessage
        {
            get => _errorMessage;
            set { SetProperty(ref _errorMessage, value); OnPropertyChanged(nameof(HasError)); }
        }
        public bool HasError => !string.IsNullOrEmpty(ErrorMessage);

        private string _searchText = string.Empty;
        public string SearchText
        {
            get => _searchText;
            set { SetProperty(ref _searchText, value); ApplyFilter(); }
        }

        private string _selectedStatus = "Всі";
        public string SelectedStatus
        {
            get => _selectedStatus;
            set { SetProperty(ref _selectedStatus, value); ApplyFilter(); }
        }

        public List<string> StatusOptions { get; } = new() { "Всі", "Активні", "Деактивовані" };

        private ObservableCollection<DoctorDisplayModel> _doctors = new();
        public ObservableCollection<DoctorDisplayModel> Doctors
        {
            get => _doctors;
            set => SetProperty(ref _doctors, value);
        }

        private int _totalDoctors;
        public int TotalDoctors
        {
            get => _totalDoctors;
            set => SetProperty(ref _totalDoctors, value);
        }

        public async Task LoadAsync()
        {
            try
            {
                IsLoading = true;
                ErrorMessage = string.Empty;

                var doctors = await _doctorService.GetAllAsync();
                if (doctors == null) return;

                _allDoctors = doctors.Select(d => new DoctorDisplayModel
                {
                    Id = d.Id,
                    PersonId = d.PersonId,
                    FullName = d.Person?.FullName ?? "—",
                    Specialization = d.Specialization,
                    Email = d.Person?.Account?.Email ?? "—",
                    IsActive = d.Person?.Account?.IsActive ?? true,
                    ContactInfo = d.Person?.ContactInfo ?? "—",
                }).ToList();

                ApplyFilter();
            }
            catch (Exception ex)
            {
                ErrorMessage = $"Помилка завантаження: {ex.Message}";
            }
            finally
            {
                IsLoading = false;
            }
        }

        private void ApplyFilter()
        {
            var result = _allDoctors.AsEnumerable();

            if (!string.IsNullOrWhiteSpace(SearchText))
                result = result.Where(d =>
                    d.FullName.Contains(SearchText, StringComparison.OrdinalIgnoreCase) ||
                    d.Specialization.Contains(SearchText, StringComparison.OrdinalIgnoreCase) ||
                    d.Email.Contains(SearchText, StringComparison.OrdinalIgnoreCase));

            if (SelectedStatus == "Активні")
                result = result.Where(d => d.IsActive);
            else if (SelectedStatus == "Деактивовані")
                result = result.Where(d => !d.IsActive);

            var filtered = result.OrderBy(d => d.FullName).ToList();
            TotalDoctors = filtered.Count;
            Doctors = new ObservableCollection<DoctorDisplayModel>(filtered);
        }

        public async Task ToggleActiveAsync(DoctorDisplayModel doctor)
        {
            try
            {
                if (doctor.IsActive)
                    await _doctorService.DeactivateAsync(doctor.PersonId);
                else
                    await _doctorService.ActivateAsync(doctor.PersonId);

                doctor.IsActive = !doctor.IsActive;
                ApplyFilter();
            }
            catch (ApiException ex)
            {
                ErrorMessage = ex.Message;
            }
        }
    }

    public class DoctorDisplayModel : ObservableObject
    {
        public int Id { get; set; }
        public int PersonId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Specialization { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string ContactInfo { get; set; } = string.Empty;

        private bool _isActive;
        public bool IsActive
        {
            get => _isActive;
            set
            {
                SetProperty(ref _isActive, value);
                OnPropertyChanged(nameof(StatusDisplay));
                OnPropertyChanged(nameof(StatusColor));
                OnPropertyChanged(nameof(StatusTextColor));
                OnPropertyChanged(nameof(ToggleButtonText));
                OnPropertyChanged(nameof(ToggleButtonColor));
            }
        }

        public string StatusDisplay => IsActive ? "Активний" : "Деактивований";
        public string StatusColor => IsActive ? "#EAF3DE" : "#F1EFE8";
        public string StatusTextColor => IsActive ? "#3B6D11" : "#5F5E5A";
        public string ToggleButtonText => IsActive ? "Деактивувати" : "Активувати";
        public string ToggleButtonColor => IsActive ? "#FAEEDA" : "#EAF3DE";
        public string ToggleButtonTextColor => IsActive ? "#854F0B" : "#3B6D11";


        private bool _isExpanded;
        public bool IsExpanded
        {
            get => _isExpanded;
            set => SetProperty(ref _isExpanded, value);
        }
    }
}