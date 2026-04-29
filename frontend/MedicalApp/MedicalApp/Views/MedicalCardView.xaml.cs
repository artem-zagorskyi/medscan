using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Media;
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
        Loaded += OnLoaded;
    }

    private void OnLoaded(object sender, RoutedEventArgs e)
    {
        EntryPageButtons.ItemContainerGenerator.StatusChanged += OnEntryPageButtonsGenerated;
        ResearchPageButtons.ItemContainerGenerator.StatusChanged += OnResearchPageButtonsGenerated;
    }

    private void OnEntryPageButtonsGenerated(object? sender, EventArgs e)
    {
        if (EntryPageButtons.ItemContainerGenerator.Status == GeneratorStatus.ContainersGenerated)
            UpdateEntryPageButtons(_vm.CurrentPage);
    }

    private void OnResearchPageButtonsGenerated(object? sender, EventArgs e)
    {
        if (ResearchPageButtons.ItemContainerGenerator.Status == GeneratorStatus.ContainersGenerated)
            UpdateResearchPageButtons(_vm.ResearchCurrentPage);
    }

    // --- Навигация ---
    private void BackButton_Click(object sender, RoutedEventArgs e)
    {
        var mainWindow = (MainWindow)App.Current.MainWindow;
        mainWindow.NavigateTo(new PatientListView());
    }

    private void EditButton_Click(object sender, RoutedEventArgs e)
    {
        if (_vm.CurrentRecord != null)
        {
            var mainWindow = (MainWindow)App.Current.MainWindow;
            mainWindow.NavigateTo(new EditMedicalCardView(_vm.Patient, _vm.CurrentRecord));
        }
    }

    private void NewRecordButton_Click(object sender, RoutedEventArgs e)
    {
        if (_vm.CurrentRecord != null)
        {
            var window = new NewRecordWindow(_vm.Patient, _vm.CurrentRecord);
            window.Owner = App.Current.MainWindow;
            if (window.ShowDialog() == true)
            {
                var mainWindow = (MainWindow)App.Current.MainWindow;
                mainWindow.NavigateTo(new MedicalCardView(_vm.Patient));
            }
        }
    }

    // --- Вкладки ---
    private void RecordsTab_Click(object sender, RoutedEventArgs e) => _vm.ActiveTab = 0;
    private void ResearchTab_Click(object sender, RoutedEventArgs e) => _vm.ActiveTab = 1;

    // --- Фильтры записей ---
    private void EntryFilterButton_Click(object sender, RoutedEventArgs e)
        => EntryFilterPopup.IsOpen = !EntryFilterPopup.IsOpen;

    private void ResetEntryFilter_Click(object sender, RoutedEventArgs e)
    {
        _vm.ResetEntryFilters();
        EntryFilterPopup.IsOpen = false;
    }

    // --- Фильтры исследований ---
    private void ResearchFilterButton_Click(object sender, RoutedEventArgs e)
        => ResearchFilterPopup.IsOpen = !ResearchFilterPopup.IsOpen;

    private void ResetResearchFilter_Click(object sender, RoutedEventArgs e)
    {
        _vm.ResetResearchFilters();
        ResearchFilterPopup.IsOpen = false;
    }

    // --- Раскрытие записи ---
    private void ToggleEntryDetails_Click(object sender, RoutedEventArgs e)
    {
        if (sender is Button btn && btn.Tag is MedicalRecordEntryModel entry)
            entry.IsExpanded = !entry.IsExpanded;
    }

    // --- Обработка исследования ---
    private void ProcessResearch_Click(object sender, RoutedEventArgs e)
    {
        if (sender is Button btn && btn.Tag is ResearchDisplayModel research)
            MessageBox.Show($"Обробка дослідження #{research.Id}", "Незабаром",
                MessageBoxButton.OK, MessageBoxImage.Information);
    }

    // --- Пагинация записей ---
    private void PrevPage_Click(object sender, RoutedEventArgs e)
    {
        _vm.PrevPageCommand.Execute(null);
        RefreshEntryPageButtons();
    }

    private void NextPage_Click(object sender, RoutedEventArgs e)
    {
        _vm.NextPageCommand.Execute(null);
        RefreshEntryPageButtons();
    }

    private void EntryPageButton_Click(object sender, RoutedEventArgs e)
    {
        if (sender is not Button btn || btn.Tag is not int page) return;
        _vm.GoToPageCommand.Execute(page);
        UpdateEntryPageButtons(page);
    }

    private void RefreshEntryPageButtons()
    {
        Dispatcher.InvokeAsync(() => UpdateEntryPageButtons(_vm.CurrentPage),
            System.Windows.Threading.DispatcherPriority.Loaded);
    }

    private void UpdateEntryPageButtons(int currentPage)
    {
        if (EntryPageButtons == null) return;
        UpdatePageButtons(EntryPageButtons, currentPage);
    }

    // --- Пагинация исследований ---
    private void ResearchPrevPage_Click(object sender, RoutedEventArgs e)
    {
        _vm.ResearchPrevPageCommand.Execute(null);
        RefreshResearchPageButtons();
    }

    private void ResearchNextPage_Click(object sender, RoutedEventArgs e)
    {
        _vm.ResearchNextPageCommand.Execute(null);
        RefreshResearchPageButtons();
    }

    private void ResearchPageButton_Click(object sender, RoutedEventArgs e)
    {
        if (sender is not Button btn || btn.Tag is not int page) return;
        _vm.GoToResearchPageCommand.Execute(page);
        UpdateResearchPageButtons(page);
    }

    private void RefreshResearchPageButtons()
    {
        Dispatcher.InvokeAsync(() => UpdateResearchPageButtons(_vm.ResearchCurrentPage),
            System.Windows.Threading.DispatcherPriority.Loaded);
    }

    private void UpdateResearchPageButtons(int currentPage)
    {
        if (ResearchPageButtons == null) return;
        UpdatePageButtons(ResearchPageButtons, currentPage);
    }

    // --- Общий метод обновления кнопок ---
    private void UpdatePageButtons(ItemsControl control, int currentPage)
    {
        var active = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#185FA5"));
        var activeBg = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#E6F1FB"));
        var inactive = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#D3D1C7"));
        var inactiveBg = new SolidColorBrush(Colors.White);
        var inactiveFg = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#2C2C2A"));

        foreach (var item in control.Items)
        {
            var container = control.ItemContainerGenerator
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
}