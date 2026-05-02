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

    private void AllergySeverity_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (sender is ComboBox cb && cb.SelectedIndex >= 0)
            _vm.SelectedNewAllergySeverity = _vm.SeverityOptions[cb.SelectedIndex];
    }

    private void NewDiseaseStatus_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (sender is ComboBox cb && cb.SelectedIndex >= 0)
            _vm.SelectedNewDiseaseStatus = _vm.DiseaseStatusOptions[cb.SelectedIndex];
    }
}