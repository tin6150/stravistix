class CommonSettingsController {

    static $inject = ['$scope', 'CommonSettingsService', 'ChromeStorageService', '$location', '$mdDialog', '$sce'];

    constructor($scope: any, CommonSettingsService: ICommonSettingsService, ChromeStorageService: IChromeStorageService, $location: ILocationService, $mdDialog: IDialogService, $sce: ISCEService) {

        // Define options structure
        $scope.sections = CommonSettingsService.provideSections();

        ChromeStorageService.fetchUserSettings((userSettingsSynced: IUserSettings) => {

            $scope.userMaxHr = userSettingsSynced.userMaxHr;
            $scope.userRestHr = userSettingsSynced.userRestHr;
            $scope.userFTP = userSettingsSynced.userFTP;

            _.each($scope.sections, (section: ISection) => {

                _.each(section.sectionContent, (option: ISectionContent) => {

                    if (option.optionType === 'checkbox') {

                        // option.active = _.propertyOf(userSettingsSynced)(option.optionKey);;
                        option.active = _.propertyOf(userSettingsSynced)(option.optionKey);

                        if (option.optionEnableSub) {
                            _.each(option.optionEnableSub, (subKey: string) => {
                                $scope.displaySubOption(subKey, _.propertyOf(userSettingsSynced)(option.optionKey));
                            });
                        }

                    } else if (option.optionType === 'list') {
                        option.active = _.findWhere(option.optionList, {
                            key: _.propertyOf(userSettingsSynced)(option.optionKey)
                        });
                    } else if (option.optionType === 'integer') {
                        option.value = _.propertyOf(userSettingsSynced)(option.optionKey);
                        ;
                    } else {
                        console.error('Option type not supported');
                    }
                });
            });

            $scope.$apply();
        });

        $scope.toggleCheckOption = (option: ISectionContent) => {

            ChromeStorageService.updateUserSetting(option.optionKey, option.active, () => {
                console.log(option.optionKey + ' has been updated to ' + option.active);
            });

            // Enable/disable sub option if needed
            if (option.optionEnableSub) {
                // Replace this to find option object from option.optionEnableSub
                _.each(option.optionEnableSub, (subKey: string) => {
                    $scope.displaySubOption(subKey, option.active);
                });
            }
        };

        $scope.displaySubOption = (subOptionKey: string, show: boolean) => {
            _.each($scope.sections, (section: ISection) => {
                let optionFound: ISectionContent = _.findWhere(section.sectionContent, {
                    optionKey: subOptionKey
                });
                if (optionFound) {
                    optionFound.hidden = !show;
                }
            });
        };

        $scope.toggleSelectOption = (option: ISectionContent) => {

            ChromeStorageService.updateUserSetting(option.optionKey, option.active.key, () => {
                console.log(option.optionKey + ' has been updated to ' + option.active);
            });
        };


        $scope.toggleIntegerOption = (option: ISectionContent) => {

            $scope.$watch('option.value', () => {

                if (option.value < 0) {
                    if (option.value == -1) {
                        option.value = 0;
                    } else {
                        option.value = Math.abs(option.value);
                    }
                }

            });

            let saveValue: number = (_.isNull(option.value) || _.isUndefined(option.value)) ? 0 : option.value;

            ChromeStorageService.updateUserSetting(option.optionKey, saveValue, () => {
                console.log(option.optionKey + ' has been updated to ' + saveValue);
            });
        };

        $scope.displayOptionHelper = (optionKeyParam: string) => {

            let option: ISectionContent = null;

            _.each($scope.sections, (section: ISection) => {

                let optionSearch: ISectionContent = _.findWhere(section.sectionContent, {
                    optionKey: optionKeyParam
                });

                if (optionSearch) {
                    option = optionSearch;

                }
            });

            if (option) {

                $mdDialog.show({
                    controller: ($scope: any) => {
                        $scope.title = option.optionTitle;
                        $scope.htmlContent = $sce.trustAsHtml(option.optionHtml); // Mark the html as "trusted" with Strict Contextual Escaping ($sce)
                        $scope.hide = () => {
                            $mdDialog.hide();
                        };
                    },
                    templateUrl: 'views/modals/settingHint.html',
                    parent: angular.element(document.body),
                    clickOutsideToClose: true
                });
            }
        };

        // Trigger auto click on activity page extended data click
        let viewOptionHelperId: number = $location.search().viewOptionHelperId;

        if (!_.isUndefined(viewOptionHelperId)) {
            $scope.displayOptionHelper(viewOptionHelperId);
        }

        // Apply search text if searchText GET param exist
        if ($location.search().searchText) {
            $scope.searchText = $location.search().searchText;
        }

    }
}

app.controller('CommonSettingsController', CommonSettingsController);
