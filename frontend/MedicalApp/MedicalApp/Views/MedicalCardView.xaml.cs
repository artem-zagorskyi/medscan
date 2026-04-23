using System.Windows;
using System.Windows.Controls;
using MedicalApp.ViewModels;

namespace MedicalApp.Views;

public partial class MedicalCardView : UserControl
{
    private readonly MedicalCardViewModel _vm;

    public MedicalCardView(PatientDisplayModel patient)
    {
        InitializeComponent();
        _vm = new MedicalCardViewModel(patient);
        DataContext = _vm;
    }

    private void BackButton_Click(object sender, RoutedEventArgs e)
    {
        var mainWindow = (MainWindow)App.Current.MainWindow;
        mainWindow.NavigateTo(new PatientListView());
    }

    private void EntryFilterButton_Click(object sender, RoutedEventArgs e)
    {
        EntryFilterPopup.IsOpen = !EntryFilterPopup.IsOpen;
    }

    private void EntryTypeFilter_Click(object sender, RoutedEventArgs e)
    {
        if (sender is Button btn && btn.Tag is string type)
            _vm.SelectedEntryType = type;
        EntryFilterPopup.IsOpen = false;
    }

    private void ResetEntryFilter_Click(object sender, RoutedEventArgs e)
    {
        _vm.ResetFilters();
        EntryFilterPopup.IsOpen = false;
    }

    private void PageButton_Click(object sender, RoutedEventArgs e)
    {
        if (sender is Button btn && btn.Tag is int page)
            _vm.GoToPageCommand.Execute(page);
    }

    private void EditButton_Click(object sender, RoutedEventArgs e)
    {
        if (_vm.CurrentRecord != null)
        {
            var mainWindow = (MainWindow)App.Current.MainWindow;
            mainWindow.NavigateTo(new EditMedicalCardView(_vm.Patient, _vm.CurrentRecord));
        }
    }
}