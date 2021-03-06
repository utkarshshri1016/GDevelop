// @flow
import { Trans } from '@lingui/macro';

import * as React from 'react';
import ObjectGroupsListWithObjectGroupEditor from '../../ObjectGroupsList/ObjectGroupsListWithObjectGroupEditor';
import { Tabs, Tab } from '../../UI/Tabs';
import EventsFunctionParametersEditor from './EventsFunctionParametersEditor';
import EventsFunctionPropertiesEditor from './EventsFunctionPropertiesEditor';
import ScrollView from '../../UI/ScrollView';
import { Column } from '../../UI/Grid';
import { showWarningBox } from '../../UI/Messages/MessageBox';
import { type GroupWithContext } from '../../ObjectsList/EnumerateObjects';
import { type UnsavedChanges } from '../../MainFrame/UnsavedChangesContext';

const gd = global.gd;

type Props = {|
  project: gdProject,
  globalObjectsContainer: gdObjectsContainer,
  objectsContainer: gdObjectsContainer,
  eventsFunction: gdEventsFunction,
  eventsBasedBehavior: ?gdEventsBasedBehavior,
  onParametersOrGroupsUpdated: () => void,
  helpPagePath?: string,
  onConfigurationUpdated?: () => void,
  renderConfigurationHeader?: () => React.Node,
  freezeParameters?: boolean,
  freezeEventsFunctionType?: boolean,
  unsavedChanges?: UnsavedChanges,
|};

type TabNames = 'config' | 'parameters' | 'groups';

type State = {|
  currentTab: TabNames,
|};

export default class EventsFunctionConfigurationEditor extends React.Component<
  Props,
  State
> {
  state = {
    currentTab: 'config',
  };

  _canObjectOrGroupUseNewName = (newName: string) => {
    const { objectsContainer, globalObjectsContainer } = this.props;

    if (
      objectsContainer.hasObjectNamed(newName) ||
      globalObjectsContainer.hasObjectNamed(newName) ||
      objectsContainer.getObjectGroups().has(newName) ||
      globalObjectsContainer.getObjectGroups().has(newName)
    ) {
      showWarningBox(
        'Another object or group with this name already exists in this function.'
      );
      return false;
    } else if (!gd.Project.validateName(newName)) {
      showWarningBox(
        'This name is invalid. Only use alphanumeric characters (0-9, a-z) and underscores. Digits are not allowed as the first character.'
      );
      return false;
    }

    return true;
  };

  _onDeleteGroup = (
    groupWithContext: GroupWithContext,
    done: boolean => void
  ) => {
    const { group } = groupWithContext;
    const {
      project,
      eventsFunction,
      globalObjectsContainer,
      objectsContainer,
    } = this.props;

    //eslint-disable-next-line
    const answer = confirm(
      'Do you want to remove all references to this group in events (actions and conditions using the group)?'
    );

    gd.WholeProjectRefactorer.objectOrGroupRemovedInEventsFunction(
      project,
      eventsFunction,
      globalObjectsContainer,
      objectsContainer,
      group.getName(),
      /* isObjectGroup=*/ true,
      !!answer
    );
    done(true);
  };

  _onRenameGroup = (
    groupWithContext: GroupWithContext,
    newName: string,
    done: boolean => void
  ) => {
    const { group } = groupWithContext;
    const {
      project,
      eventsFunction,
      globalObjectsContainer,
      objectsContainer,
    } = this.props;

    // newName is supposed to have been already validated

    // Avoid triggering renaming refactoring if name has not really changed
    if (group.getName() !== newName) {
      gd.WholeProjectRefactorer.objectOrGroupRenamedInEventsFunction(
        project,
        eventsFunction,
        globalObjectsContainer,
        objectsContainer,
        group.getName(),
        newName,
        /* isObjectGroup=*/ true
      );
    }

    done(true);
  };

  _chooseTab = (currentTab: TabNames) =>
    this.setState({
      currentTab,
    });

  render() {
    const {
      project,
      globalObjectsContainer,
      objectsContainer,
      eventsFunction,
      eventsBasedBehavior,
      freezeEventsFunctionType,
      onConfigurationUpdated,
      onParametersOrGroupsUpdated,
      freezeParameters,
      helpPagePath,
      renderConfigurationHeader,
    } = this.props;

    return (
      <Column expand noMargin useMaxHeight>
        <Tabs value={this.state.currentTab} onChange={this._chooseTab}>
          <Tab
            label={<Trans>Configuration</Trans>}
            value={('config': TabNames)}
          />
          <Tab
            label={<Trans>Parameters</Trans>}
            value={('parameters': TabNames)}
          />
          <Tab
            label={<Trans>Object groups</Trans>}
            value={('groups': TabNames)}
          />
        </Tabs>
        {this.state.currentTab === 'config' ? (
          <ScrollView>
            <EventsFunctionPropertiesEditor
              eventsFunction={eventsFunction}
              eventsBasedBehavior={eventsBasedBehavior}
              helpPagePath={helpPagePath}
              onConfigurationUpdated={onConfigurationUpdated}
              renderConfigurationHeader={renderConfigurationHeader}
              freezeEventsFunctionType={freezeEventsFunctionType}
            />
          </ScrollView>
        ) : null}
        {this.state.currentTab === 'parameters' ? (
          <ScrollView>
            <EventsFunctionParametersEditor
              project={project}
              eventsFunction={eventsFunction}
              eventsBasedBehavior={eventsBasedBehavior}
              onParametersUpdated={onParametersOrGroupsUpdated}
              helpPagePath={helpPagePath}
              freezeParameters={freezeParameters}
            />
          </ScrollView>
        ) : null}
        {this.state.currentTab === 'groups' ? (
          <ObjectGroupsListWithObjectGroupEditor
            project={project}
            globalObjectsContainer={globalObjectsContainer}
            objectsContainer={objectsContainer}
            globalObjectGroups={globalObjectsContainer.getObjectGroups()}
            objectGroups={eventsFunction.getObjectGroups()}
            canRenameGroup={this._canObjectOrGroupUseNewName}
            onRenameGroup={this._onRenameGroup}
            onDeleteGroup={this._onDeleteGroup}
            onGroupsUpdated={onParametersOrGroupsUpdated}
            canSetAsGlobalGroup={false}
            unsavedChanges={this.props.unsavedChanges}
          />
        ) : null}
      </Column>
    );
  }
}
