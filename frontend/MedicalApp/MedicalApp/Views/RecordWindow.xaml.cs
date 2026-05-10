using System.Windows;
using System.Windows.Controls;
using MedicalApp.Services;
using MedicalApp.ViewModels;

namespace MedicalApp.Views;

public partial class RecordWindow : Window
{
    private readonly RecordViewModel _vm;

    public RecordWindow(PatientDisplayModel patient, FullMedicalRecordResponse record,
        MedicalRecordEntryModel entry, CaseDisplayModel caseModel, bool startInEditMode = false)
    {
        InitializeComponent();
        _vm = new RecordViewModel(entry, caseModel, record, startInEditMode);
        _vm.OnSaved = () =>
        {
            DialogResult = true;
            Close();
        };
        DataContext = _vm;

        Loaded += (s, e) =>
        {
            if (RecordTypeCombo != null)
                RecordTypeCombo.SelectedIndex = _vm.SelectedRecordTypeIndex;
        };
    }

    private void CloseOrBackButton_Click(object sender, RoutedEventArgs e)
    {
        if (_vm.IsEditMode)
            _vm.SwitchToViewCommand.Execute(null);
        else
            Close();
    }

    private void RecordType_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (sender is ComboBox cb && cb.SelectedIndex >= 0)
            _vm.SelectedRecordType = _vm.RecordTypeOptions[cb.SelectedIndex];
    }

    private void ToggleMedications_Click(object sender, RoutedEventArgs e)
        => _vm.IsMedicationsExpanded = !_vm.IsMedicationsExpanded;

    private void ToggleAnamnesis_Click(object sender, RoutedEventArgs e)
        => _vm.IsAnamnesisExpanded = !_vm.IsAnamnesisExpanded;

    private void ToggleVitals_Click(object sender, RoutedEventArgs e)
        => _vm.IsVitalsExpanded = !_vm.IsVitalsExpanded;

    private void ToggleExamStatus_Click(object sender, RoutedEventArgs e)
        => _vm.IsExamStatusExpanded = !_vm.IsExamStatusExpanded;

    private void ToggleAllergies_Click(object sender, RoutedEventArgs e)
        => _vm.IsAllergiesExpanded = !_vm.IsAllergiesExpanded;

    private void ToggleDiagnoses_Click(object sender, RoutedEventArgs e)
        => _vm.IsDiagnosesExpanded = !_vm.IsDiagnosesExpanded;

    private void ToggleResearches_Click(object sender, RoutedEventArgs e)
        => _vm.IsResearchesExpanded = !_vm.IsResearchesExpanded;

    private void NewDiseaseStatus_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (sender is ComboBox cb && cb.SelectedIndex >= 0)
            _vm.SelectedNewDiseaseStatus = _vm.DiseaseStatusOptions[cb.SelectedIndex];
    }

    private void AllergySeverity_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (sender is not ComboBox cb || cb.SelectedIndex < 0) return;

        // Якщо це ComboBox у рядку списку — DataContext є EditAllergyModel
        if (cb.DataContext is EditAllergyModel allergy)
        {
            allergy.Severity = _vm.SeverityOptions[cb.SelectedIndex];
            allergy.SeverityDisplay = _vm.SeverityDisplayOptions[cb.SelectedIndex];
            allergy.SeverityColor = cb.SelectedIndex switch { 2 => "#FCEBEB", 1 => "#FAEEDA", _ => "#EAF3DE" };
            allergy.SeverityTextColor = cb.SelectedIndex switch { 2 => "#A32D2D", 1 => "#854F0B", _ => "#3B6D11" };
            return;
        }

        // Інакше — це форма додавання, оновлюємо ViewModel
        _vm.SelectedNewAllergySeverity = _vm.SeverityOptions[cb.SelectedIndex];
    }

    private void DiagnosisStatus_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (sender is not ComboBox cb || cb.SelectedIndex < 0) return;

        if (cb.DataContext is EditDiagnosisModel diagnosis)
        {
            diagnosis.Status = _vm.DiseaseStatusOptions[cb.SelectedIndex];
            diagnosis.StatusDisplay = _vm.DiseaseStatusDisplayOptions[cb.SelectedIndex];
            diagnosis.StatusColor = cb.SelectedIndex switch { 0 => "#FCEBEB", 1 => "#FAEEDA", _ => "#EAF3DE" };
            diagnosis.StatusTextColor = cb.SelectedIndex switch { 0 => "#A32D2D", 1 => "#854F0B", _ => "#3B6D11" };
            return;
        }

        _vm.SelectedNewDiseaseStatus = _vm.DiseaseStatusOptions[cb.SelectedIndex];
    }

    private void ViewResearchFromRecord_Click(object sender, RoutedEventArgs e)
    {
        if (sender is not Button btn) return;

        ResearchDisplayModel? research = null;

        // Режим перегляду — Tag це RecordResearchResponse
        if (btn.Tag is RecordResearchResponse rr && rr.Research != null)
        {
            research = new ResearchDisplayModel
            {
                Id = rr.Research.Id,
                ResearchType = rr.Research.ResearchType,
                StatusDisplay = rr.Research.StatusDisplay,
                IsFromFile = false,
                StatusColor = "#EAF3DE",
                StatusTextColor = "#3B6D11",
                CreatedAt = rr.Research.CreatedAt,
                Status = rr.Research.Status,
                Results = rr.Research.Results,
                ProcessedAt = rr.Research.ProcessedAt
            };
        }
        // Режим редагування — Tag це ResearchSelectItem
        else if (btn.Tag is ResearchSelectItem item)
        {
            research = new ResearchDisplayModel
            {
                Id = item.Id,
                ResearchType = item.ResearchType,
                StatusDisplay = item.StatusDisplay,
                IsFromFile = item.IsFromFile,
                FilePath = item.FilePath,
                StatusColor = item.IsFromFile ? "#FAEEDA" : "#EAF3DE",
                StatusTextColor = item.IsFromFile ? "#854F0B" : "#3B6D11",
                CreatedAt = DateTime.Today,
                Status = item.IsFromFile ? "PENDING" : "PROCESSED"
            };
        }

        if (research == null) return;

        var window = new ViewResearchWindow(
            research,
            _vm.DoctorName,
            new List<CaseDisplayModel>(),
            0
        );
        window.Owner = this;
        window.ShowDialog();
    }

    private void ResearchPrevPage_Click(object sender, RoutedEventArgs e)
        => _vm.ResearchPrevPageCommand.Execute(null);

    private void ResearchNextPage_Click(object sender, RoutedEventArgs e)
        => _vm.ResearchNextPageCommand.Execute(null);

    private async void ProcessResearchFromRecord_Click(object sender, RoutedEventArgs e)
    {
        if (sender is not Button btn || btn.Tag is not ResearchSelectItem item)
            return;

        var research = new ResearchDisplayModel
        {
            Id = item.Id,
            ResearchType = item.ResearchType,
            IsFromFile = true,
            FileId = item.Id,
            FilePath = item.FilePath,
            StatusColor = "#FAEEDA",
            StatusTextColor = "#854F0B",
            CreatedAt = DateTime.Today,
            Status = "PENDING",
            StatusDisplay = "Очікує обробки"
        };

        var window = new ProcessResearchWindow(
            research,
            _vm.DoctorName,
            new List<CaseDisplayModel>(),
            0
        );
        window.Owner = this;
        window.ShowDialog();
    }
}