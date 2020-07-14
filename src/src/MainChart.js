import React from 'react';
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';

import I18n from '@iobroker/adapter-react/i18n';
import Theme from './Theme';
import ChartSettings from './Components/ChartSettings';
import ChartFrame from './Components/ChartFrame';
import getUrlQuery from './utils/getUrlQuery';

const styles = theme => ({

    toolbar: {
        minHeight: 38,//Theme.toolbar.height,
        boxShadow: '0px 2px 4px -1px rgba(0, 0, 0, 0.2), 0px 4px 5px 0px rgba(0, 0, 0, 0.14), 0px 1px 10px 0px rgba(0, 0, 0, 0.12)'
    },
    toolbarButtons: {
        padding: 4,
        marginLeft: 4
    },
    editorDiv: {
        height: `calc(100% - ${Theme.toolbar.height + 38/*Theme.toolbar.height */ + 1}px)`,
        width: '100%',
        overflow: 'hidden',
        position: 'relative'
    },
    textButton: {
        marginRight: 10,
        minHeight: 24,
        padding: '6px 16px'
    },
    tabIcon: {
        width: 24,
        height: 24,
        verticalAlign: 'middle',
        marginBottom: 2,
        marginRight: 2,
        borderRadius: 3
    },
    hintIcon: {
        //fontSize: 32,
        padding: '0 8px 0 8px'
    },
    hintText: {
        //fontSize: 18
    },
    hintButton: {
        marginTop: 8,
        marginLeft: 20
    },
    tabMenuButton: {
        position: 'absolute',
        top: 0,
        right: 0,
    },
    tabChanged: {
        color: theme.palette.secondary.main
    },
    tabText: {
        maxWidth: 130,
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        display: 'inline-block',
        verticalAlign: 'middle',
    },
    tabChangedIcon: {
        color: '#FF0000',
        fontSize: 16
    },
    closeButton: {
        position: 'absolute',
        top: 8,
        right: 0,
        zIndex: 10,
        padding: 8,
        cursor: 'pointer'
    },
    notRunning: {
        color: '#ffbc00'
    },
    tabButton: {

    },
    tabButtonWrapper: {
        display: 'inline-block',
    },
    menuIcon: {
        width: 18,
        height: 18,
        borderRadius: 2,
        marginRight: 5
    },
});

class Editor extends React.Component {

    getTabs() {
        return this.props.presetMode ? null : <>
            <ChartSettings
                onChange={this.props.onChange}
                presetData={this.props.presetData}
            />
            <Button className={this.props.classes.hintButton} onClick={this.props.enablePresetMode}>
                {I18n.t('Edit mode')}
            </Button>
        </>
    }

    getUrl() {
        let translate = {
            "lines": "l",
            "marks": "m"
        }
        let translateObject = {
            "lines": {},
            "marks": {
                "lineId": "l",
                "upperValueOrId": "v",
                "lowerValueOrId": "vl",
                "color": "c",
                "fill": "f",
                "ol": "t",
                "os": "s",
                "text": "d",
                "textPosition": "p",
                "textOffset": "py",
                "textColor": "fc",
                "textSize": "fs",
            },
        }
        let url = '';
        for (let k in this.props.presetData) {
            let v = this.props.presetData[k];
            let translateCurrentObject = translateObject[k];
            if (translate[k]) {
                k = translate[k];
            }
            if (Array.isArray(v)) {
                v.forEach((arrayObject, index) => {
                    for (let k2 in arrayObject) {
                        let v2 = arrayObject[k2];
                        if (translateCurrentObject[k2]) {
                            k2 = translateCurrentObject[k2];
                        }
                        url += encodeURIComponent(k+'['+index+']['+k2+']') + '=' + encodeURIComponent(v2) + '&';
                    }
                });
            } else {
                url += encodeURIComponent(k) + '=' + encodeURIComponent(v) + '&';
            }
        }
        
        return url;
    }

    getChartFrame() {
        const query = getUrlQuery();
        const host = query.host ? query.host : 'localhost'
        return (<div style={{display: this.props.visible ? "inline" : "none"}}><ChartFrame
            src={"http://" + host + ":8082/flot/index.html?" + this.getUrl()}
        /></div>);
    }

    render() {
        return [
            this.getTabs(),
            <pre>{JSON.stringify(this.props.presetData, null, 2)}</pre>,
            <pre>{this.getUrl()}</pre>,
            this.getChartFrame(),
        ];
    }
}

Editor.propTypes = {
    objects: PropTypes.object.isRequired,
    selected: PropTypes.string.isRequired,
    onSelectedChange: PropTypes.func.isRequired,
    onRestart: PropTypes.func,
    onChange: PropTypes.func.isRequired,
    visible: PropTypes.bool,
    menuOpened: PropTypes.bool,
    onLocate: PropTypes.func,
    runningInstances: PropTypes.object,
    connection: PropTypes.object,
    searchText: PropTypes.string,
    theme: PropTypes.string
};

export default withStyles(styles)(Editor);
