using System.Windows;
using System.Windows.Controls;
using MedicalApp.Services;
using MedicalApp.ViewModels;

namespace MedicalApp.Views;

public partial class NewRecordWindow : Window
{
    private readonly NewRecordViewModel _vm;

    public NewRecordWindow(PatientDisplayModel patient, FullMedicalRecordResponse record)
    {
        InitializeComponent();
        _vm = new NewRecordViewModel(patient, record);
        _vm.OnSaved = () =>
        {
            DialogResult = true;
            Close();
        };
        DataContext = _vm;
    }

    private void CancelButton_Click(object sender, RoutedEventArgs e)
    {
        DialogResult = false;
        Close();
    }

    private void ToggleResearch_Click(object sender, RoutedEventArgs e)
        => _vm.IsResearchExpanded = !_vm.IsResearchExpanded;

    private void ToggleAllergies_Click(object sender, RoutedEventArgs e)
        => _vm.IsAllergiesExpanded = !_vm.IsAllergiesExpanded;

    private void ToggleDiagnoses_Click(object sender, RoutedEventArgs e)
        => _vm.IsDiagnosesExpanded = !_vm.IsDiagnosesExpanded;

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