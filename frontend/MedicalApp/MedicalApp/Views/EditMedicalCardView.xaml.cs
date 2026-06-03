using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using MedicalApp.Services;
using MedicalApp.ViewModels;

namespace MedicalApp.Views;

public partial class EditMedicalCardView : UserControl
{
    private readonly EditMedicalCardViewModel _vm;

    public EditMedicalCardView(PatientDisplayModel patient, FullMedicalRecordResponse record)
    {
        InitializeComponent();
        _vm = new EditMedicalCardViewModel(patient, record);
        DataContext = _vm;
        Loaded += OnLoaded;
    }

    private void OnLoaded(object sender, RoutedEventArgs e)
    {
        UpdateBloodGroupButtons();
    }

    private void BackButton_Click(object sender, RoutedEventArgs e)
    {
        var mainWindow = (MainWindow)App.Current.MainWindow;
        mainWindow.NavigateTo(new MedicalCardView(_vm.Patient));
    }

    private void BloodGroupButton_Click(object sender, RoutedEventArgs e)
    {
        if (sender is not Button btn || btn.Tag is not string group) return;
        _vm.SelectedBloodGroup = group;
        UpdateBloodGroupButtons();
    }

    private void UpdateBloodGroupButtons()
    {
        if (BloodGroupPanel == null) return;

        foreach (var item in BloodGroupPanel.Items)
        {
            var container = BloodGroupPanel.ItemContainerGenerator
                .ContainerFromItem(item) as ContentPresenter;
            if (container == null) continue;

            var btn = FindVisualChild<Button>(container);
            if (btn == null || btn.Tag is not string tag) continue;

            bool isSelected = tag == _vm.SelectedBloodGroup;
            btn.Background = new SolidColorBrush(isSelected
                ? (Color)ColorConverter.ConvertFromString("#E6F1FB")
                : Colors.White);
            btn.BorderBrush = new SolidColorBrush(isSelected
                ? (Color)ColorConverter.ConvertFromString("#185FA5")
                : (Color)ColorConverter.ConvertFromString("#D3D1C7"));
            btn.Foreground = new SolidColorBrush(isSelected
                ? (Color)ColorConverter.ConvertFromString("#185FA5")
                : (Color)ColorConverter.ConvertFromString("#5F5E5A"));
        }
    }

    private void AllergySeverity_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (sender is ComboBox cb && cb.Tag is EditAllergyModel allergy && cb.SelectedIndex >= 0)
            _vm.OnAllergySeverityChanged(allergy, cb.SelectedIndex);
    }

    private void NewAllergySeverity_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (sender is ComboBox cb && cb.SelectedIndex >= 0)
            _vm.SelectedNewAllergySeverity = _vm.SeverityOptions[cb.SelectedIndex];
    }

    private void DiseaseStatus_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (sender is ComboBox cb && cb.Tag is EditDiagnosisModel diagnosis && cb.SelectedIndex >= 0)
            _vm.OnDiseaseStatusChanged(diagnosis, cb.SelectedIndex);
    }

    private void NewDiseaseStatus_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (sender is ComboBox cb && cb.SelectedIndex >= 0)
            _vm.SelectedNewDiseaseStatus = _vm.DiseaseStatusOptions[cb.SelectedIndex];
    }

    private static T? FindVisualChild<T>(DependencyObject parent) where T : DependencyObject
    {
        for (int i = 0; i < VisualTreeHelper.GetChildrenCount(parent); i++)
        {
            var child = VisualTreeHelper.GetChild(parent, i);
            if (child is T result) return result;
            var found = FindVisualChild<T>(child);
            if (found != null) return found;
        }
        return null;
    }
}