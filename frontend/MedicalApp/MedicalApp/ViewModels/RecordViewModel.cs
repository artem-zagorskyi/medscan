using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MedicalApp.Helpers;
using MedicalApp.Models;
using MedicalApp.Services;
using System.Collections.ObjectModel;
using System.Windows.Media.Media3D;

namespace MedicalApp.ViewModels
{
    public partial class RecordViewModel : ObservableObject
    {
        private readonly RecordService _recordService = new();
        private readonly AllergenService _allergenService = new();
        private readonly DiseaseService _diseaseService = new();
        private readonly MedicationService _medicationService = new();
        private readonly DoctorService _doctorService = new();
        private readonly RecordMedicationService _recordMedicationService = new();
        private readonly RecordResearchService _recordResearchService = new();

        private RecordResponse? _fullRecord;
        private readonly int _recordId;

        public Action? OnSaved { get; set; }

        public RecordViewModel(MedicalRecordEntryModel entry, CaseDisplayModel caseModel,
            FullMedicalRecordResponse medicalRecord, bool startInEditMode = false)
        {
            _recordId = entry.Id;
            CaseName = caseModel.MainCondition;
            IsDraft = !entry.IsSigned;
            IsEditMode = startInEditMode && IsDraft;

            // Одразу з entry
            DoctorName = entry.DoctorName;
            TypeDisplay = entry.TypeDisplay;
            Specialization = entry.Specialization;
            VisitDateDisplay = entry.VisitDateDisplay;
            Complaints = entry.Complaints;
            DoctorConclusion = entry.Conclusion;
            TreatmentPlan = entry.TreatmentPlan;

            // Дослідження кейсу для редагування
            CaseResearches = new ObservableCollection<ResearchSelectItem>(
                caseModel.Researches.Select(r => new ResearchSelectItem
                {
                    Id = r.Id,
                    ResearchType = r.ResearchType,
                    StatusDisplay = r.StatusDisplay,
                    IsSelected = false
                })
            );

            _ = LoadFullDataAsync(caseModel, medicalRecord);
        }

        // --- Режим ---
        [ObservableProperty]
        [NotifyPropertyChangedFor(nameof(IsViewMode))]
        [NotifyPropertyChangedFor(nameof(WindowTitle))]
        private bool _isEditMode;

        public bool IsViewMode => !IsEditMode;
        public string WindowTitle => IsEditMode ? "Редагування запису" : "Перегляд запису";

        // --- Стан ---
        [ObservableProperty] private bool _isLoading;
        [ObservableProperty] private bool _isSaving;
        [ObservableProperty] private bool _isDraft;

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

        // --- Інфо ---
        [ObservableProperty] private string _caseName = string.Empty;
        [ObservableProperty] private string _doctorName = string.Empty;
        [ObservableProperty] private string _typeDisplay = string.Empty;
        [ObservableProperty] private string _specialization = string.Empty;
        [ObservableProperty] private string _visitDateDisplay = string.Empty;

        public string HeaderSubtitle => $"{DoctorName} · {VisitDateDisplay}";
        public string CaseSubtitle => $"Кейс: {CaseName}";

        // --- Тип запису (для редагування) ---
        public List<string> RecordTypeOptions { get; } = new() { "EXAM", "CONSILIUM", "EPICRISIS" };
        public List<string> RecordTypeDisplayOptions { get; } = new() { "Огляд", "Консиліум", "Епікриз" };

        private string _selectedRecordType = "EXAM";
        public string SelectedRecordType
        {
            get => _selectedRecordType;
            set
            {
                SetProperty(ref _selectedRecordType, value);
                OnPropertyChanged(nameof(IsConsilium));
            }
        }
        public bool IsConsilium => SelectedRecordType == "CONSILIUM";
        public int SelectedRecordTypeIndex => RecordTypeOptions.IndexOf(SelectedRecordType);

        // --- Чернетка ---
        [ObservableProperty] private bool _isDraftSave;

        // --- Основні поля ---
        [ObservableProperty] private string? _complaints;
        [ObservableProperty] private string? _historyOfIllness;
        [ObservableProperty] private string? _historyOfLife;
        [ObservableProperty] private string? _socialHabits;
        [ObservableProperty] private string? _generalCondition;
        [ObservableProperty] private string? _skinStatus;
        [ObservableProperty] private string? _respiratorySystem;
        [ObservableProperty] private string? _cardiovascular;
        [ObservableProperty] private string? _doctorConclusion;
        [ObservableProperty] private string? _treatmentPlan;

        // --- Вітальні ---
        [ObservableProperty] private string? _temperature;
        [ObservableProperty] private string? _bloodPressure;
        [ObservableProperty] private string? _heartRate;
        [ObservableProperty] private string? _spo2;
        [ObservableProperty] private string? _weight;
        [ObservableProperty] private string? _height;

        // --- Акордеони ---
        [ObservableProperty] private bool _isAnamnesisExpanded;
        [ObservableProperty] private bool _isVitalsExpanded;
        [ObservableProperty] private bool _isExamStatusExpanded;
        [ObservableProperty] private bool _isMedicationsExpanded;
        [ObservableProperty] private bool _isAllergiesExpanded;
        [ObservableProperty] private bool _isDiagnosesExpanded;
        [ObservableProperty] private bool _isResearchesExpanded;

        // --- Перегляд: списки ---
        [ObservableProperty] private ObservableCollection<RecordDiagnosisResponse> _diagnoses = new();
        [ObservableProperty] private ObservableCollection<RecordMedicationResponse> _medications = new();
        [ObservableProperty] private ObservableCollection<RecordAllergyResponse> _allergies = new();
        [ObservableProperty] private ObservableCollection<RecordResearchResponse> _researches = new();
        [ObservableProperty] private ObservableCollection<RecordDoctorResponse> _consiliumDoctors = new();

        // --- Редагування: списки ---
        [ObservableProperty] private ObservableCollection<NewMedicationModel> _newMedications = new();
        [ObservableProperty] private ObservableCollection<EditAllergyModel> _newAllergies = new();
        [ObservableProperty] private ObservableCollection<EditDiagnosisModel> _newDiagnoses = new();
        [ObservableProperty] private ObservableCollection<ConsiliumDoctorModel> _editConsiliumDoctors = new();
        [ObservableProperty] private ObservableCollection<ResearchSelectItem> _caseResearches = new();

        // --- Довідники ---
        [ObservableProperty] private ObservableCollection<AllergenItemResponse> _availableAllergens = new();
        [ObservableProperty] private ObservableCollection<DiseaseItemResponse> _availableDiseases = new();
        [ObservableProperty] private ObservableCollection<MedicationItemResponse> _availableMedications = new();
        [ObservableProperty] private ObservableCollection<DoctorSelectItem> _availableDoctors = new();

        // --- Вибрані для додавання ---
        [ObservableProperty] private AllergenItemResponse? _selectedAllergen;
        [ObservableProperty] private DiseaseItemResponse? _selectedDisease;
        [ObservableProperty] private MedicationItemResponse? _selectedMedication;
        [ObservableProperty] private DoctorSelectItem? _selectedConsiliumDoctor;

        [ObservableProperty] private string _medicationDosage = string.Empty;
        [ObservableProperty] private string _medicationFrequency = string.Empty;
        [ObservableProperty] private string _medicationDuration = string.Empty;
        [ObservableProperty] private string _medicationComment = string.Empty;
        [ObservableProperty] private string _consiliumDoctorRole = "Консультант";
        [ObservableProperty] private string _selectedNewAllergySeverity = "MILD";
        [ObservableProperty] private string _selectedNewDiseaseStatus = "ACTIVE";

        public List<string> SeverityOptions { get; } = new() { "MILD", "MODERATE", "SEVERE" };
        public List<string> SeverityDisplayOptions { get; } = new() { "Легка", "Помірна", "Важка" };
        public List<string> DiseaseStatusOptions { get; } = new() { "ACTIVE", "CHRONIC", "RECOVERED" };
        public List<string> DiseaseStatusDisplayOptions { get; } = new() { "Активна", "Хронічна", "Одужав" };

        // --- Has* для перегляду ---
        public bool HasAnamnesis => !string.IsNullOrEmpty(HistoryOfIllness) ||
                                    !string.IsNullOrEmpty(HistoryOfLife) ||
                                    !string.IsNullOrEmpty(SocialHabits);
        public bool HasVitals => !string.IsNullOrEmpty(Temperature) ||
                                 !string.IsNullOrEmpty(BloodPressure) ||
                                 !string.IsNullOrEmpty(HeartRate) ||
                                 !string.IsNullOrEmpty(Spo2) ||
                                 !string.IsNullOrEmpty(Weight) ||
                                 !string.IsNullOrEmpty(Height);
        public bool HasExamStatus => !string.IsNullOrEmpty(GeneralCondition) ||
                                     !string.IsNullOrEmpty(SkinStatus) ||
                                     !string.IsNullOrEmpty(RespiratorySystem) ||
                                     !string.IsNullOrEmpty(Cardiovascular);
        public bool HasConclusion => !string.IsNullOrEmpty(DoctorConclusion) ||
                                     !string.IsNullOrEmpty(TreatmentPlan);
        public bool HasDiagnoses => Diagnoses.Count > 0;
        public bool HasMedications => Medications.Count > 0;
        public bool HasAllergies => Allergies.Count > 0;
        public bool HasResearches => Researches.Count > 0;
        public bool HasConsiliumDoctors => ConsiliumDoctors.Count > 0;

        // --- Завантаження ---
        private async Task LoadFullDataAsync(CaseDisplayModel caseModel, FullMedicalRecordResponse medicalRecord)
        {
            try
            {
                IsLoading = true;
                _fullRecord = await _recordService.GetByIdAsync(_recordId);
                if (_fullRecord == null) return;

                // Заповнюємо поля перегляду
                SelectedRecordType = _fullRecord.Type;
                Complaints = _fullRecord.Complaints;
                HistoryOfIllness = _fullRecord.HistoryOfIllness;
                HistoryOfLife = _fullRecord.HistoryOfLife;
                SocialHabits = _fullRecord.SocialHabits;
                GeneralCondition = _fullRecord.GeneralCondition;
                SkinStatus = _fullRecord.SkinStatus;
                RespiratorySystem = _fullRecord.RespiratorySystem;
                Cardiovascular = _fullRecord.Cardiovascular;
                DoctorConclusion = _fullRecord.DoctorConclusion;
                TreatmentPlan = _fullRecord.TreatmentPlan;
                Temperature = _fullRecord.Temperature?.ToString();
                BloodPressure = _fullRecord.BloodPressure;
                HeartRate = _fullRecord.HeartRate?.ToString();
                Spo2 = _fullRecord.Spo2?.ToString();
                Weight = _fullRecord.Weight?.ToString();
                Height = _fullRecord.Height?.ToString();

                // Списки для перегляду
                Diagnoses = new ObservableCollection<RecordDiagnosisResponse>(_fullRecord.RecordDiagnoses);
                Medications = new ObservableCollection<RecordMedicationResponse>(_fullRecord.RecordMedications);
                Allergies = new ObservableCollection<RecordAllergyResponse>(_fullRecord.RecordAllergies);
                Researches = new ObservableCollection<RecordResearchResponse>(_fullRecord.RecordResearches);
                ConsiliumDoctors = new ObservableCollection<RecordDoctorResponse>(_fullRecord.RecordDoctors);

                // Списки для редагування
                NewMedications = new ObservableCollection<NewMedicationModel>(
                    _fullRecord.RecordMedications.Select(m => new NewMedicationModel
                    {
                        MedicationId = m.Medication?.Id ?? 0,
                        Name = m.Medication?.Name ?? "—",
                        DosageUnit = m.Medication?.DosageUnit ?? string.Empty,
                        Dosage = m.Dosage ?? string.Empty,
                        Frequency = m.Frequency ?? string.Empty,
                        Duration = m.Duration ?? string.Empty,
                        Comment = m.Comment ?? string.Empty,
                    })
                );

                EditConsiliumDoctors = new ObservableCollection<ConsiliumDoctorModel>(
                    _fullRecord.RecordDoctors.Select(d => new ConsiliumDoctorModel
                    {
                        DoctorId = d.Doctor?.Id ?? 0,
                        FullName = d.Doctor?.FullName ?? "—",
                        Specialization = d.Doctor?.Specialization ?? "—",
                        Role = d.Role
                    })
                );

                NewAllergies = new ObservableCollection<EditAllergyModel>(
                    _fullRecord.RecordAllergies.Select(a => new EditAllergyModel
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

                NewDiagnoses = new ObservableCollection<EditDiagnosisModel>(
                    _fullRecord.RecordDiagnoses.Select(d => new EditDiagnosisModel
                    {
                        DiseaseId = d.Disease?.Id ?? 0,
                        IcdCode = d.Disease?.IcdCode ?? "—",
                        Name = d.Disease?.Name ?? "—",
                        Status = "ACTIVE",
                        StatusDisplay = "Активна",
                        StatusColor = "#FCEBEB",
                        StatusTextColor = "#A32D2D",
                        DiagnosedAt = DateTime.Today
                    })
                );

                CaseResearches = new ObservableCollection<ResearchSelectItem>(
                    caseModel.Researches.Select(r => new ResearchSelectItem
                    {
                        Id = r.Id,
                        ResearchType = r.ResearchType,
                        StatusDisplay = r.StatusDisplay,
                        IsSelected = _fullRecord.RecordResearches.Any(rr => rr.Research?.Id == r.Id)
                    })
                );

                // Довідники
                var allergens = await _allergenService.GetAllAsync();
                if (allergens != null)
                    AvailableAllergens = new ObservableCollection<AllergenItemResponse>(allergens);

                var diseases = await _diseaseService.GetAllAsync();
                if (diseases != null)
                    AvailableDiseases = new ObservableCollection<DiseaseItemResponse>(diseases);

                var medications = await _medicationService.GetAllAsync();
                if (medications != null)
                    AvailableMedications = new ObservableCollection<MedicationItemResponse>(medications);

                var doctors = await _doctorService.GetAllAsync();
                if (doctors != null)
                    AvailableDoctors = new ObservableCollection<DoctorSelectItem>(
                        doctors.Select(d => new DoctorSelectItem
                        {
                            Id = d.Id,
                            FullName = d.Person?.FullName ?? "—",
                            Specialization = d.Specialization
                        })
                    );

                // Нотифікуємо computed properties
                OnPropertyChanged(nameof(HasAnamnesis));
                OnPropertyChanged(nameof(HasVitals));
                OnPropertyChanged(nameof(HasExamStatus));
                OnPropertyChanged(nameof(HasConclusion));
                OnPropertyChanged(nameof(HasDiagnoses));
                OnPropertyChanged(nameof(HasMedications));
                OnPropertyChanged(nameof(HasAllergies));
                OnPropertyChanged(nameof(HasResearches));
                OnPropertyChanged(nameof(HasConsiliumDoctors));
                OnPropertyChanged(nameof(HeaderSubtitle));
                OnPropertyChanged(nameof(CaseSubtitle));
            }
            catch { }
            finally
            {
                IsLoading = false;
            }
        }

        // --- Команди ---
        [RelayCommand]
        private void SwitchToEdit()
        {
            if (IsDraft) IsEditMode = true;
        }

        [RelayCommand]
        private void SwitchToView() => IsEditMode = false;

        [RelayCommand]
        private void AddConsiliumDoctor()
        {
            if (SelectedConsiliumDoctor == null) return;
            if (EditConsiliumDoctors.Any(d => d.DoctorId == SelectedConsiliumDoctor.Id))
            {
                ErrorMessage = "Цей лікар вже доданий";
                return;
            }
            EditConsiliumDoctors.Add(new ConsiliumDoctorModel
            {
                DoctorId = SelectedConsiliumDoctor.Id,
                FullName = SelectedConsiliumDoctor.FullName,
                Specialization = SelectedConsiliumDoctor.Specialization,
                Role = string.IsNullOrWhiteSpace(ConsiliumDoctorRole) ? "Консультант" : ConsiliumDoctorRole
            });
            SelectedConsiliumDoctor = null;
            ConsiliumDoctorRole = "Консультант";
            ErrorMessage = string.Empty;
        }

        [RelayCommand]
        private void RemoveConsiliumDoctor(ConsiliumDoctorModel doctor) =>
            EditConsiliumDoctors.Remove(doctor);

        [RelayCommand]
        private void AddMedication()
        {
            if (SelectedMedication == null) return;
            NewMedications.Add(new NewMedicationModel
            {
                MedicationId = SelectedMedication.Id,
                Name = SelectedMedication.DisplayName,
                DosageUnit = SelectedMedication.DosageUnit ?? string.Empty,
                Dosage = MedicationDosage,
                Frequency = MedicationFrequency,
                Duration = MedicationDuration,
                Comment = MedicationComment,
            });
            SelectedMedication = null;
            MedicationDosage = string.Empty;
            MedicationFrequency = string.Empty;
            MedicationDuration = string.Empty;
            MedicationComment = string.Empty;
        }

        [RelayCommand]
        private void RemoveMedication(NewMedicationModel med) => NewMedications.Remove(med);

        [RelayCommand]
        private void AddAllergy()
        {
            if (SelectedAllergen == null) return;
            if (NewAllergies.Any(a => a.AllergenId == SelectedAllergen.Id))
            {
                ErrorMessage = "Ця алергія вже додана";
                return;
            }
            NewAllergies.Add(new EditAllergyModel
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
            ErrorMessage = string.Empty;
        }

        [RelayCommand]
        private void RemoveAllergy(EditAllergyModel allergy) => NewAllergies.Remove(allergy);

        [RelayCommand]
        private void AddDisease()
        {
            if (SelectedDisease == null) return;
            if (NewDiagnoses.Any(d => d.DiseaseId == SelectedDisease.Id))
            {
                ErrorMessage = "Цей діагноз вже додано";
                return;
            }
            NewDiagnoses.Add(new EditDiagnosisModel
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
            ErrorMessage = string.Empty;
        }

        [RelayCommand]
        private void RemoveDiagnosis(EditDiagnosisModel d) => NewDiagnoses.Remove(d);

        [RelayCommand]
        private async Task SaveAsync()
        {
            if (string.IsNullOrWhiteSpace(Complaints) && string.IsNullOrWhiteSpace(DoctorConclusion))
            {
                ErrorMessage = "Заповніть хоча б скарги або висновок лікаря";
                return;
            }

            try
            {
                IsSaving = true;
                ErrorMessage = string.Empty;

                await _recordService.UpdateAsync(_recordId, new CreateRecordRequest
                {
                    MedicalRecordId = _fullRecord!.MedicalRecordId,
                    CaseId = _fullRecord.CaseId,
                    AuthorId = SessionManager.DoctorId,
                    Type = SelectedRecordType,
                    Status = IsDraftSave ? "DRAFT" : "SIGNED",
                    VisitDate = DateTime.Today.ToString("yyyy-MM-dd"),
                    Complaints = N(Complaints),
                    HistoryOfIllness = N(HistoryOfIllness),
                    HistoryOfLife = N(HistoryOfLife),
                    SocialHabits = N(SocialHabits),
                    GeneralCondition = N(GeneralCondition),
                    SkinStatus = N(SkinStatus),
                    RespiratorySystem = N(RespiratorySystem),
                    Cardiovascular = N(Cardiovascular),
                    DoctorConclusion = N(DoctorConclusion),
                    TreatmentPlan = N(TreatmentPlan),
                    Temperature = decimal.TryParse(Temperature, out var t) ? t : null,
                    BloodPressure = N(BloodPressure),
                    HeartRate = int.TryParse(HeartRate, out var hr) ? hr : null,
                    Spo2 = int.TryParse(Spo2, out var s) ? s : null,
                    Weight = decimal.TryParse(Weight, out var w) ? w : null,
                    Height = decimal.TryParse(Height, out var h) ? h : null,
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

        private static string? N(string? s) =>
            string.IsNullOrWhiteSpace(s) ? null : s;
    }
}