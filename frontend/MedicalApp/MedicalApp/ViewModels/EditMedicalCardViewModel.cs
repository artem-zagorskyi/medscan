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

        // Списки отложенных изменений
        private readonly List<EditAllergyModel> _allergiesToAdd = new();
        private readonly List<int> _allergiesToRemove = new(); // allergenId
        private readonly List<EditAllergyModel> _allergiesToUpdateSeverity = new();
        private readonly List<EditDiagnosisModel> _diagnosesToAdd = new();
        private readonly List<int> _diagnosesToRemove = new(); // diseaseId
        private readonly List<EditDiagnosisModel> _diagnosesToUpdateStatus = new();

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
            set
            {
                SetProperty(ref _selectedBloodGroup, value);
                OnPropertyChanged(nameof(SelectedBloodGroupLabel));
            }
        }

        public string SelectedBloodGroupLabel => SelectedBloodGroup switch
        {
            "O" => "O (I) — Перша",
            "A" => "A (II) — Друга",
            "B" => "B (III) — Третя",
            "AB" => "AB (IV) — Четверта",
            _ => "—"
        };

        public List<string> BloodGroupOptions { get; } = new() { "O", "A", "B", "AB" };

        public string GetBloodGroupLabel(string group) => group switch
        {
            "O" => "O (I)",
            "A" => "A (II)",
            "B" => "B (III)",
            "AB" => "AB (IV)",
            _ => group
        };

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

                SelectedBloodGroup = record.BloodGroup ?? "A";
                IsRhPositive = record.RhFactor != "NEGATIVE";

                Allergies = new ObservableCollection<EditAllergyModel>(
                    record.PatientAllergies.Select(a => new EditAllergyModel
                    {
                        AllergenId = a.Allergen?.Id ?? 0,
                        Name = a.Allergen?.Name ?? "—",
                        Severity = a.ReactionSeverity,
                        SeverityDisplay = SeverityToDisplay(a.ReactionSeverity),
                        SeverityColor = SeverityToColor(a.ReactionSeverity),
                        SeverityTextColor = SeverityToTextColor(a.ReactionSeverity),
                        IsNew = false
                    })
                );

                Diagnoses = new ObservableCollection<EditDiagnosisModel>(
                    record.PatientDiseases.Select(d => new EditDiagnosisModel
                    {
                        DiseaseId = d.Disease?.Id ?? 0,
                        IcdCode = d.Disease?.IcdCode ?? "—",
                        Name = d.Disease?.Name ?? "—",
                        Status = d.Status,
                        StatusDisplay = StatusToDisplay(d.Status),
                        DiagnosedAt = d.DiagnosedAt,
                        StatusColor = StatusToColor(d.Status),
                        StatusTextColor = StatusToTextColor(d.Status),
                        IsNew = false
                    })
                );

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

        // --- Пошук ---
        private async Task SearchAllergensAsync(string query)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(query))
                {
                    var all = await _allergenService.GetAllAsync();
                    if (all != null) AvailableAllergens = new ObservableCollection<AllergenItemResponse>(all);
                    return;
                }
                var results = await _allergenService.SearchAsync(query);
                if (results != null) AvailableAllergens = new ObservableCollection<AllergenItemResponse>(results);
            }
            catch { }
        }

        private async Task SearchDiseasesAsync(string query)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(query))
                {
                    var all = await _diseaseService.GetAllAsync();
                    if (all != null) AvailableDiseases = new ObservableCollection<DiseaseItemResponse>(all);
                    return;
                }
                var results = await _diseaseService.SearchAsync(query);
                if (results != null) AvailableDiseases = new ObservableCollection<DiseaseItemResponse>(results);
            }
            catch { }
        }

        // --- Локальні зміни алергій ---
        [RelayCommand]
        private void AddAllergy()
        {
            if (SelectedAllergen == null)
            {
                ErrorMessage = "Алерген не обрано — SelectedAllergen is null";
                return;
            }

            if (Allergies.Any(a => a.AllergenId == SelectedAllergen.Id))
            {
                ErrorMessage = "Ця алергія вже додана";
                return;
            }

            // Якщо була в черзі на видалення — просто відміняємо видалення
            if (_allergiesToRemove.Contains(SelectedAllergen.Id))
            {
                _allergiesToRemove.Remove(SelectedAllergen.Id);
            }

            var model = new EditAllergyModel
            {
                AllergenId = SelectedAllergen.Id,
                Name = SelectedAllergen.Name,
                Severity = SelectedNewAllergySeverity,
                SeverityDisplay = SeverityToDisplay(SelectedNewAllergySeverity),
                SeverityColor = SeverityToColor(SelectedNewAllergySeverity),
                SeverityTextColor = SeverityToTextColor(SelectedNewAllergySeverity),
                IsNew = true
            };

            _allergiesToAdd.Add(model);
            Allergies.Add(model);

            SelectedAllergen = null;
            AllergenSearchText = string.Empty;
            ErrorMessage = string.Empty;
        }

        [RelayCommand]
        private void RemoveAllergy(EditAllergyModel allergy)
        {
            // Якщо нова — просто прибираємо з черги додавання
            if (allergy.IsNew)
                _allergiesToAdd.Remove(allergy);
            else
                _allergiesToRemove.Add(allergy.AllergenId);

            Allergies.Remove(allergy);
        }

        [RelayCommand]
        private void UpdateAllergySeverity(EditAllergyModel allergy)
        {
            allergy.SeverityColor = SeverityToColor(allergy.Severity);
            allergy.SeverityTextColor = SeverityToTextColor(allergy.Severity);
            allergy.SeverityDisplay = SeverityToDisplay(allergy.Severity);

            if (!allergy.IsNew && !_allergiesToUpdateSeverity.Contains(allergy))
                _allergiesToUpdateSeverity.Add(allergy);
        }

        // --- Локальні зміни діагнозів ---
        [RelayCommand]
        private void AddDisease()
        {
            if (SelectedDisease == null)
            {
                ErrorMessage = "Діагноз не обрано — SelectedDisease is null";
                return;
            }

            if (Diagnoses.Any(d => d.DiseaseId == SelectedDisease.Id))
            {
                ErrorMessage = "Цей діагноз вже додано";
                return;
            }

            if (_diagnosesToRemove.Contains(SelectedDisease.Id))
                _diagnosesToRemove.Remove(SelectedDisease.Id);

            var model = new EditDiagnosisModel
            {
                DiseaseId = SelectedDisease.Id,
                IcdCode = SelectedDisease.IcdCode,
                Name = SelectedDisease.Name,
                Status = SelectedNewDiseaseStatus,
                StatusDisplay = StatusToDisplay(SelectedNewDiseaseStatus),
                DiagnosedAt = DateTime.Today,
                StatusColor = StatusToColor(SelectedNewDiseaseStatus),
                StatusTextColor = StatusToTextColor(SelectedNewDiseaseStatus),
                IsNew = true
            };

            _diagnosesToAdd.Add(model);
            Diagnoses.Add(model);

            SelectedDisease = null;
            DiseaseSearchText = string.Empty;
            ErrorMessage = string.Empty;
        }

        [RelayCommand]
        private void RemoveDisease(EditDiagnosisModel diagnosis)
        {
            if (diagnosis.IsNew)
                _diagnosesToAdd.Remove(diagnosis);
            else
                _diagnosesToRemove.Add(diagnosis.DiseaseId);

            Diagnoses.Remove(diagnosis);
        }

        public void OnDiseaseStatusChanged(EditDiagnosisModel diagnosis, int selectedIndex)
        {
            diagnosis.Status = DiseaseStatusOptions[selectedIndex];
            diagnosis.StatusDisplay = DiseaseStatusDisplayOptions[selectedIndex];
            diagnosis.StatusColor = StatusToColor(diagnosis.Status);
            diagnosis.StatusTextColor = StatusToTextColor(diagnosis.Status);

            if (!diagnosis.IsNew && !_diagnosesToUpdateStatus.Contains(diagnosis))
                _diagnosesToUpdateStatus.Add(diagnosis);
        }

        public void OnAllergySeverityChanged(EditAllergyModel allergy, int selectedIndex)
        {
            allergy.Severity = SeverityOptions[selectedIndex];
            allergy.SeverityDisplay = SeverityDisplayOptions[selectedIndex];
            allergy.SeverityColor = SeverityToColor(allergy.Severity);
            allergy.SeverityTextColor = SeverityToTextColor(allergy.Severity);

            if (!allergy.IsNew && !_allergiesToUpdateSeverity.Contains(allergy))
                _allergiesToUpdateSeverity.Add(allergy);
        }

        // --- Зберегти всі зміни ---
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

                foreach (var a in _allergiesToAdd)
                {
                    try
                    {
                        await _patientAllergyService.AddAsync(_originalRecord.Id, a.AllergenId, a.Severity, DateTime.Today);
                    }
                    catch (Exception ex)
                    {
                        ErrorMessage = $"Помилка додавання алергії {a.Name}: {ex.Message}";
                        return;
                    }
                }

                foreach (var id in _allergiesToRemove)
                {
                    try
                    {
                        await _patientAllergyService.RemoveAsync(_originalRecord.Id, id);
                    }
                    catch (Exception ex)
                    {
                        ErrorMessage = $"Помилка видалення алергії: {ex.Message}";
                        return;
                    }
                }

                foreach (var d in _diagnosesToAdd)
                {
                    try
                    {
                        await _patientDiseaseService.AddAsync(_originalRecord.Id, d.DiseaseId, d.Status, DateTime.Today);
                    }
                    catch (Exception ex)
                    {
                        ErrorMessage = $"Помилка додавання діагнозу {d.Name}: {ex.Message}";
                        return;
                    }
                }

                foreach (var id in _diagnosesToRemove)
                {
                    try
                    {
                        await _patientDiseaseService.RemoveAsync(_originalRecord.Id, id);
                    }
                    catch (Exception ex)
                    {
                        ErrorMessage = $"Помилка видалення діагнозу: {ex.Message}";
                        return;
                    }
                }

                foreach (var a in _allergiesToUpdateSeverity)
                {
                    try
                    {
                        await _patientAllergyService.UpdateSeverityAsync(_originalRecord.Id, a.AllergenId, a.Severity);
                    }
                    catch (Exception ex)
                    {
                        ErrorMessage = $"Помилка оновлення алергії {a.Name}: {ex.Message}";
                        return;
                    }
                }

                foreach (var d in _diagnosesToUpdateStatus)
                {
                    try
                    {
                        await _patientDiseaseService.UpdateStatusAsync(_originalRecord.Id, d.DiseaseId, d.Status);
                    }
                    catch (Exception ex)
                    {
                        ErrorMessage = $"Помилка оновлення діагнозу {d.Name}: {ex.Message}";
                        return;
                    }
                }

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

        // --- Хелпери ---
        private static string SeverityToDisplay(string s) => s switch
        {
            "SEVERE" => "Важка",
            "MODERATE" => "Помірна",
            _ => "Легка"
        };

        private static string SeverityToColor(string s) => s switch
        {
            "SEVERE" => "#FCEBEB",
            "MODERATE" => "#FAEEDA",
            _ => "#EAF3DE"
        };

        private static string SeverityToTextColor(string s) => s switch
        {
            "SEVERE" => "#A32D2D",
            "MODERATE" => "#854F0B",
            _ => "#3B6D11"
        };

        private static string StatusToDisplay(string s) => s switch
        {
            "ACTIVE" => "Активна",
            "CHRONIC" => "Хронічна",
            _ => "Одужав"
        };

        private static string StatusToColor(string s) => s switch
        {
            "ACTIVE" => "#FCEBEB",
            "CHRONIC" => "#FAEEDA",
            _ => "#EAF3DE"
        };

        private static string StatusToTextColor(string s) => s switch
        {
            "ACTIVE" => "#A32D2D",
            "CHRONIC" => "#854F0B",
            _ => "#3B6D11"
        };
    }

    // --- Допоміжні моделі ---
    public class EditAllergyModel : ObservableObject
    {
        public int AllergenId { get; set; }
        public string Name { get; set; } = string.Empty;
        public bool IsNew { get; set; }

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

        private string _severityColor = string.Empty;
        public string SeverityColor
        {
            get => _severityColor;
            set => SetProperty(ref _severityColor, value);
        }

        private string _severityTextColor = string.Empty;
        public string SeverityTextColor
        {
            get => _severityTextColor;
            set => SetProperty(ref _severityTextColor, value);
        }
    }

    public class EditDiagnosisModel : ObservableObject
    {
        public int DiseaseId { get; set; }
        public string IcdCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public DateTime DiagnosedAt { get; set; }
        public string DiagnosedAtDisplay => DiagnosedAt.ToString("dd.MM.yyyy");
        public bool IsNew { get; set; }

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