using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MedicalApp.Services;
using System.Collections.ObjectModel;

namespace MedicalApp.ViewModels
{
    public partial class EditMedicalCardViewModel : ObservableObject
    {
        private readonly MedicalRecordService _medicalRecordService = new();
        private readonly AllergenService _allergenService = new();
        private readonly DiseaseService _diseaseService = new();
        private readonly PatientAllergyService _patientAllergyService = new();
        private readonly PatientDiseaseService _patientDiseaseService = new();

        private readonly FullMedicalRecordResponse _originalRecord;

        [RelayCommand]
        private void SetRhPositive() => IsRhPositive = true;

        [RelayCommand]
        private void SetRhNegative() => IsRhPositive = false;

        public EditMedicalCardViewModel(PatientDisplayModel patient, FullMedicalRecordResponse record)
        {
            Patient = patient;
            _originalRecord = record;
            _ = LoadDataAsync(record);
        }

        public PatientDisplayModel Patient { get; }

        // --- Стан ---
        private bool _isLoading;
        public bool IsLoading
        {
            get => _isLoading;
            set => SetProperty(ref _isLoading, value);
        }

        private bool _isSaving;
        public bool IsSaving
        {
            get => _isSaving;
            set => SetProperty(ref _isSaving, value);
        }

        private string _errorMessage = string.Empty;
        public string ErrorMessage
        {
            get => _errorMessage;
            set => SetProperty(ref _errorMessage, value);
        }

        // --- Група крові ---
        private string _selectedBloodGroup = string.Empty;
        public string SelectedBloodGroup
        {
            get => _selectedBloodGroup;
            set => SetProperty(ref _selectedBloodGroup, value);
        }

        public List<string> BloodGroupOptions { get; } = new() { "A", "B", "AB", "O" };

        // --- Резус фактор ---
        private bool _isRhPositive = true;
        public bool IsRhPositive
        {
            get => _isRhPositive;
            set
            {
                SetProperty(ref _isRhPositive, value);
                OnPropertyChanged(nameof(IsRhNegative));
            }
        }

        public bool IsRhNegative
        {
            get => !_isRhPositive;
            set
            {
                SetProperty(ref _isRhPositive, !value);
                OnPropertyChanged(nameof(IsRhPositive));
            }
        }

        // --- Алергії ---
        private ObservableCollection<EditAllergyModel> _allergies = new();
        public ObservableCollection<EditAllergyModel> Allergies
        {
            get => _allergies;
            set => SetProperty(ref _allergies, value);
        }

        private ObservableCollection<AllergenItemResponse> _availableAllergens = new();
        public ObservableCollection<AllergenItemResponse> AvailableAllergens
        {
            get => _availableAllergens;
            set => SetProperty(ref _availableAllergens, value);
        }

        private AllergenItemResponse? _selectedAllergen;
        public AllergenItemResponse? SelectedAllergen
        {
            get => _selectedAllergen;
            set => SetProperty(ref _selectedAllergen, value);
        }

        private string _selectedNewAllergySeverity = "MILD";
        public string SelectedNewAllergySeverity
        {
            get => _selectedNewAllergySeverity;
            set => SetProperty(ref _selectedNewAllergySeverity, value);
        }

        public List<string> SeverityOptions { get; } = new() { "MILD", "MODERATE", "SEVERE" };

        public List<string> SeverityDisplayOptions { get; } = new() { "Легка", "Помірна", "Важка" };

        private string _allergenSearchText = string.Empty;
        public string AllergenSearchText
        {
            get => _allergenSearchText;
            set
            {
                SetProperty(ref _allergenSearchText, value);
                _ = SearchAllergensAsync(value);
            }
        }

        // --- Діагнози ---
        private ObservableCollection<EditDiagnosisModel> _diagnoses = new();
        public ObservableCollection<EditDiagnosisModel> Diagnoses
        {
            get => _diagnoses;
            set => SetProperty(ref _diagnoses, value);
        }

        private ObservableCollection<DiseaseItemResponse> _availableDiseases = new();
        public ObservableCollection<DiseaseItemResponse> AvailableDiseases
        {
            get => _availableDiseases;
            set => SetProperty(ref _availableDiseases, value);
        }

        private DiseaseItemResponse? _selectedDisease;
        public DiseaseItemResponse? SelectedDisease
        {
            get => _selectedDisease;
            set => SetProperty(ref _selectedDisease, value);
        }

        private string _selectedNewDiseaseStatus = "ACTIVE";
        public string SelectedNewDiseaseStatus
        {
            get => _selectedNewDiseaseStatus;
            set => SetProperty(ref _selectedNewDiseaseStatus, value);
        }

        public List<string> DiseaseStatusOptions { get; } = new() { "ACTIVE", "CHRONIC", "RECOVERED" };
        public List<string> DiseaseStatusDisplayOptions { get; } = new() { "Активна", "Хронічна", "Одужав" };

        private string _diseaseSearchText = string.Empty;
        public string DiseaseSearchText
        {
            get => _diseaseSearchText;
            set
            {
                SetProperty(ref _diseaseSearchText, value);
                _ = SearchDiseasesAsync(value);
            }
        }

        // --- Завантаження ---
        private async Task LoadDataAsync(FullMedicalRecordResponse record)
        {
            try
            {
                IsLoading = true;

                // Група крові
                SelectedBloodGroup = record.BloodGroup ?? "A";
                IsRhPositive = record.RhFactor != "NEGATIVE";

                // Алергії
                Allergies = new ObservableCollection<EditAllergyModel>(
                    record.PatientAllergies.Select(a => new EditAllergyModel
                    {
                        AllergenId = a.Allergen?.Id ?? 0,
                        Name = a.Allergen?.Name ?? "—",
                        Severity = a.ReactionSeverity,
                        SeverityDisplay = a.ReactionSeverity switch
                        {
                            "SEVERE" => "Важка",
                            "MODERATE" => "Помірна",
                            _ => "Легка"
                        },
                        SeverityColor = a.ReactionSeverity switch
                        {
                            "SEVERE" => "#FCEBEB",
                            "MODERATE" => "#FAEEDA",
                            _ => "#EAF3DE"
                        },
                        SeverityTextColor = a.ReactionSeverity switch
                        {
                            "SEVERE" => "#A32D2D",
                            "MODERATE" => "#854F0B",
                            _ => "#3B6D11"
                        }
                    })
                );

                // Діагнози
                Diagnoses = new ObservableCollection<EditDiagnosisModel>(
                    record.PatientDiseases.Select(d => new EditDiagnosisModel
                    {
                        DiseaseId = d.Disease?.Id ?? 0,
                        IcdCode = d.Disease?.IcdCode ?? "—",
                        Name = d.Disease?.Name ?? "—",
                        Status = d.Status,
                        StatusDisplay = d.Status switch
                        {
                            "ACTIVE" => "Активна",
                            "CHRONIC" => "Хронічна",
                            _ => "Одужав"
                        },
                        DiagnosedAt = d.DiagnosedAt,
                        StatusColor = d.Status switch
                        {
                            "ACTIVE" => "#FCEBEB",
                            "CHRONIC" => "#FAEEDA",
                            _ => "#EAF3DE"
                        },
                        StatusTextColor = d.Status switch
                        {
                            "ACTIVE" => "#A32D2D",
                            "CHRONIC" => "#854F0B",
                            _ => "#3B6D11"
                        }
                    })
                );

                // Завантажуємо всі алергени і хвороби
                var allergens = await _allergenService.GetAllAsync();
                if (allergens != null)
                    AvailableAllergens = new ObservableCollection<AllergenItemResponse>(allergens);

                var diseases = await _diseaseService.GetAllAsync();
                if (diseases != null)
                    AvailableDiseases = new ObservableCollection<DiseaseItemResponse>(diseases);
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

        // --- Пошук алергенів ---
        private async Task SearchAllergensAsync(string query)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(query))
                {
                    var all = await _allergenService.GetAllAsync();
                    if (all != null)
                        AvailableAllergens = new ObservableCollection<AllergenItemResponse>(all);
                    return;
                }

                var results = await _allergenService.SearchAsync(query);
                if (results != null)
                    AvailableAllergens = new ObservableCollection<AllergenItemResponse>(results);
            }
            catch { }
        }

        // --- Пошук хвороб ---
        private async Task SearchDiseasesAsync(string query)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(query))
                {
                    var all = await _diseaseService.GetAllAsync();
                    if (all != null)
                        AvailableDiseases = new ObservableCollection<DiseaseItemResponse>(all);
                    return;
                }

                var results = await _diseaseService.SearchAsync(query);
                if (results != null)
                    AvailableDiseases = new ObservableCollection<DiseaseItemResponse>(results);
            }
            catch { }
        }

        // --- Команди алергій ---
        [RelayCommand]
        private async Task AddAllergyAsync()
        {
            if (SelectedAllergen == null) return;

            if (Allergies.Any(a => a.AllergenId == SelectedAllergen.Id))
            {
                ErrorMessage = "Ця алергія вже додана";
                return;
            }

            try
            {
                await _patientAllergyService.AddAsync(
                    _originalRecord.Id,
                    SelectedAllergen.Id,
                    SelectedNewAllergySeverity,
                    DateTime.Today
                );

                Allergies.Add(new EditAllergyModel
                {
                    AllergenId = SelectedAllergen.Id,
                    Name = SelectedAllergen.Name,
                    Severity = SelectedNewAllergySeverity,
                    SeverityDisplay = SelectedNewAllergySeverity switch
                    {
                        "SEVERE" => "Важка",
                        "MODERATE" => "Помірна",
                        _ => "Легка"
                    },
                    SeverityColor = SelectedNewAllergySeverity switch
                    {
                        "SEVERE" => "#FCEBEB",
                        "MODERATE" => "#FAEEDA",
                        _ => "#EAF3DE"
                    },
                    SeverityTextColor = SelectedNewAllergySeverity switch
                    {
                        "SEVERE" => "#A32D2D",
                        "MODERATE" => "#854F0B",
                        _ => "#3B6D11"
                    }
                });

                SelectedAllergen = null;
                AllergenSearchText = string.Empty;
                ErrorMessage = string.Empty;
            }
            catch (Exception ex)
            {
                ErrorMessage = $"Помилка додавання алергії: {ex.Message}";
            }
        }

        [RelayCommand]
        private async Task RemoveAllergyAsync(EditAllergyModel allergy)
        {
            try
            {
                await _patientAllergyService.RemoveAsync(_originalRecord.Id, allergy.AllergenId);
                Allergies.Remove(allergy);
            }
            catch (Exception ex)
            {
                ErrorMessage = $"Помилка видалення алергії: {ex.Message}";
            }
        }

        // --- Команди діагнозів ---
        [RelayCommand]
        private async Task AddDiseaseAsync()
        {
            if (SelectedDisease == null) return;

            if (Diagnoses.Any(d => d.DiseaseId == SelectedDisease.Id))
            {
                ErrorMessage = "Цей діагноз вже додано";
                return;
            }

            try
            {
                await _patientDiseaseService.AddAsync(
                    _originalRecord.Id,
                    SelectedDisease.Id,
                    SelectedNewDiseaseStatus,
                    DateTime.Today
                );

                Diagnoses.Add(new EditDiagnosisModel
                {
                    DiseaseId = SelectedDisease.Id,
                    IcdCode = SelectedDisease.IcdCode,
                    Name = SelectedDisease.Name,
                    Status = SelectedNewDiseaseStatus,
                    StatusDisplay = SelectedNewDiseaseStatus switch
                    {
                        "ACTIVE" => "Активна",
                        "CHRONIC" => "Хронічна",
                        _ => "Одужав"
                    },
                    DiagnosedAt = DateTime.Today,
                    StatusColor = SelectedNewDiseaseStatus switch
                    {
                        "ACTIVE" => "#FCEBEB",
                        "CHRONIC" => "#FAEEDA",
                        _ => "#EAF3DE"
                    },
                    StatusTextColor = SelectedNewDiseaseStatus switch
                    {
                        "ACTIVE" => "#A32D2D",
                        "CHRONIC" => "#854F0B",
                        _ => "#3B6D11"
                    }
                });

                SelectedDisease = null;
                DiseaseSearchText = string.Empty;
                ErrorMessage = string.Empty;
            }
            catch (Exception ex)
            {
                ErrorMessage = $"Помилка додавання діагнозу: {ex.Message}";
            }
        }

        [RelayCommand]
        private async Task RemoveDiseaseAsync(EditDiagnosisModel diagnosis)
        {
            try
            {
                await _patientDiseaseService.RemoveAsync(_originalRecord.Id, diagnosis.DiseaseId);
                Diagnoses.Remove(diagnosis);
            }
            catch (Exception ex)
            {
                ErrorMessage = $"Помилка видалення діагнозу: {ex.Message}";
            }
        }

        [RelayCommand]
        private async Task UpdateDiseaseStatusAsync(EditDiagnosisModel diagnosis)
        {
            try
            {
                await _patientDiseaseService.UpdateStatusAsync(
                    _originalRecord.Id,
                    diagnosis.DiseaseId,
                    diagnosis.Status
                );

                diagnosis.StatusDisplay = diagnosis.Status switch
                {
                    "ACTIVE" => "Активна",
                    "CHRONIC" => "Хронічна",
                    _ => "Одужав"
                };
                diagnosis.StatusColor = diagnosis.Status switch
                {
                    "ACTIVE" => "#FCEBEB",
                    "CHRONIC" => "#FAEEDA",
                    _ => "#EAF3DE"
                };
                diagnosis.StatusTextColor = diagnosis.Status switch
                {
                    "ACTIVE" => "#A32D2D",
                    "CHRONIC" => "#854F0B",
                    _ => "#3B6D11"
                };
            }
            catch (Exception ex)
            {
                ErrorMessage = $"Помилка оновлення статусу: {ex.Message}";
            }
        }

        // --- Зберегти ---
        [RelayCommand]
        private async Task SaveAsync()
        {
            try
            {
                IsSaving = true;
                ErrorMessage = string.Empty;

                await _medicalRecordService.UpdateBloodInfoAsync(
                    _originalRecord.Id,
                    SelectedBloodGroup,
                    IsRhPositive ? "POSITIVE" : "NEGATIVE"
                );

                var mainWindow = (MainWindow)App.Current.MainWindow;
                mainWindow.NavigateTo(new Views.MedicalCardView(Patient));
            }
            catch (Exception ex)
            {
                ErrorMessage = $"Помилка збереження: {ex.Message}";
            }
            finally
            {
                IsSaving = false;
            }
        }
    }

    // --- Допоміжні моделі ---
    public class EditAllergyModel : ObservableObject
    {
        public int AllergenId { get; set; }
        public string Name { get; set; } = string.Empty;

        private string _severity = string.Empty;
        public string Severity
        {
            get => _severity;
            set => SetProperty(ref _severity, value);
        }

        private string _severityDisplay = string.Empty;
        public string SeverityDisplay
        {
            get => _severityDisplay;
            set => SetProperty(ref _severityDisplay, value);
        }

        public string SeverityColor { get; set; } = string.Empty;
        public string SeverityTextColor { get; set; } = string.Empty;
    }

    public class EditDiagnosisModel : ObservableObject
    {
        public int DiseaseId { get; set; }
        public string IcdCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public DateTime DiagnosedAt { get; set; }
        public string DiagnosedAtDisplay => DiagnosedAt.ToString("dd.MM.yyyy");

        private string _status = string.Empty;
        public string Status
        {
            get => _status;
            set => SetProperty(ref _status, value);
        }

        private string _statusDisplay = string.Empty;
        public string StatusDisplay
        {
            get => _statusDisplay;
            set => SetProperty(ref _statusDisplay, value);
        }

        private string _statusColor = string.Empty;
        public string StatusColor
        {
            get => _statusColor;
            set => SetProperty(ref _statusColor, value);
        }

        private string _statusTextColor = string.Empty;
        public string StatusTextColor
        {
            get => _statusTextColor;
            set => SetProperty(ref _statusTextColor, value);
        }
    }
}