using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Media;
using MedicalApp.ViewModels;

namespace MedicalApp.Views;

public partial class PatientListView : UserControl
{
    public PatientListView()
    {
        InitializeComponent();
        Loaded += OnLoaded;
    }

    private void RefreshPageButtons()
    {
        if (DataContext is not PatientListViewModel vm) return;
        int page = vm.CurrentPage;
        Dispatcher.InvokeAsync(() => UpdatePageButtons(page),
            System.Windows.Threading.DispatcherPriority.Loaded);
    }

    private void OnLoaded(object sender, RoutedEventArgs e)
    {
        RefreshPageButtons();
        PageButtonsList.ItemContainerGenerator.StatusChanged += (s, e) =>
        {
            if (PageButtonsList.ItemContainerGenerator.Status ==
                System.Windows.Controls.Primitives.GeneratorStatus.ContainersGenerated)
                RefreshPageButtons();
        };
    }

    private void OnPageButtonsGenerated(object? sender, EventArgs e)
    {
        if (PageButtonsList.ItemContainerGenerator.Status == GeneratorStatus.ContainersGenerated)
        {
            if (DataContext is PatientListViewModel vm)
                UpdatePageButtons(vm.CurrentPage);
        }
    }

    private void FilterButton_Click(object sender, RoutedEventArgs e)
    {
        FilterPopup.IsOpen = !FilterPopup.IsOpen;
    }

    private void GenderFilter_Click(object sender, RoutedEventArgs e)
    {
        if (sender is not Button btn || btn.Tag is not string gender) return;
        if (DataContext is not PatientListViewModel vm) return;
        vm.SelectedGender = gender;
        UpdateGenderButtons(gender);
    }

    private void UpdateGenderButtons(string selected)
    {
        var active = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#185FA5"));
        var activeBg = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#E6F1FB"));
        var inactive = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#D3D1C7"));
        var inactiveBg = new SolidColorBrush(Colors.White);
        var inactiveFg = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#5F5E5A"));

        foreach (var (btn, tag) in new[] {
            (GenderAll, "Всі"),
            (GenderMale, "Чоловік"),
            (GenderFemale, "Жінка")
        })
        {
            bool isActive = tag == selected;
            btn.Background = isActive ? activeBg : inactiveBg;
            btn.BorderBrush = isActive ? active : inactive;
            btn.Foreground = isActive ? active : inactiveFg;
        }
    }

    private void ResetFilters_Click(object sender, RoutedEventArgs e)
    {
        if (DataContext is PatientListViewModel vm)
            vm.ResetFilters();
        UpdateGenderButtons("Всі");
        FilterPopup.IsOpen = false;
    }

    private void PrevPage_Click(object sender, RoutedEventArgs e)
    {
        if (DataContext is not PatientListViewModel vm) return;
        vm.PrevPageCommand.Execute(null);
        RefreshPageButtons();
    }

    private void NextPage_Click(object sender, RoutedEventArgs e)
    {
        if (DataContext is not PatientListViewModel vm) return;
        vm.NextPageCommand.Execute(null);
        RefreshPageButtons();
    }

    private void PageButton_Click(object sender, RoutedEventArgs e)
    {
        if (sender is not Button btn || btn.Tag is not int page) return;
        if (DataContext is not PatientListViewModel vm) return;
        vm.GoToPageCommand.Execute(page);
        RefreshPageButtons();
    }

    private void UpdatePageButtons(int currentPage)
    {
        if (PageButtonsList == null) return;

        var active = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#185FA5"));
        var activeBg = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#E6F1FB"));
        var inactive = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#D3D1C7"));
        var inactiveBg = new SolidColorBrush(Colors.White);
        var inactiveFg = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#2C2C2A"));

        foreach (var item in PageButtonsList.Items)
        {
            var container = PageButtonsList.ItemContainerGenerator
                .ContainerFromItem(item) as ContentPresenter;
            if (container == null) continue;

            var btn = FindVisualChild<Button>(container);
            if (btn == null) continue;

            bool isActive = btn.Tag is int tag && tag == currentPage;
            btn.Background = isActive ? activeBg : inactiveBg;
            btn.BorderBrush = isActive ? active : inactive;
            btn.Foreground = isActive ? active : inactiveFg;
            btn.FontWeight = isActive ? FontWeights.SemiBold : FontWeights.Normal;
        }
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

    private void OpenMedicalCard_Click(object sender, RoutedEventArgs e)
    {
        if (sender is Button btn && btn.Tag is PatientDisplayModel patient)
        {
            var mainWindow = (MainWindow)App.Current.MainWindow;
            mainWindow.NavigateTo(new MedicalCardView(patient));
        }
    }
}