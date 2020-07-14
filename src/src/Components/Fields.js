import React, {useState} from 'react';

import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import ColorPicker from 'material-ui-color-picker'
import TextField from '@material-ui/core/TextField';
import InputLabel from '@material-ui/core/InputLabel';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import MenuItem from '@material-ui/core/MenuItem';
import IconButton from '@material-ui/core/IconButton';
import {FaFolderOpen as IconFolderOpened} from 'react-icons/all';

import I18n from '@iobroker/adapter-react/i18n';
import DialogSelectID from '@iobroker/adapter-react/Dialogs/SelectID';

export function IOSelect(props) {
    return <div>
        <FormControl>
            <InputLabel shrink={true}>{ I18n.t(props.label) }</InputLabel>
            <Select 
                label={props.label} 
                onChange={(e) => {
                    props.updateValue(props.name, e.target.value)
                }} 
                value={props.formData[props.name] || ""}
                displayEmpty
            >
                {
                    props.options ? 
                    Object.keys(props.options).map((key) =>{
                        return <MenuItem key={key} value={key}>{I18n.t(props.options[key])}</MenuItem>
                    })
                     : null
                }
            </Select>
        </FormControl>
    </div>
}

export function IOCheckbox(props) {
    return <div>
        <FormControlLabel style={{paddingTop: 10}} label={I18n.t(props.label)} control={
            <Checkbox onChange={(e) => {
                props.updateValue(props.name, e.target.checked)
            }} value={props.formData[props.name] || false}/>
        }/>
    </div>
}

export function IOTextField(props) {
    return <div>
        <TextField 
            label={props.label} 
            InputLabelProps={{shrink: true}} 
            onChange={(e) => {
                props.updateValue(props.name, e.target.value)
            }} 
            value={props.formData[props.name] || ""}
            type={props.type}
        />
    </div> 
}

export function IODateTimeField(props) {
    return <div>
        <TextField type="datetime-local" label={props.label} InputLabelProps={{shrink: true}} onChange={(e) => {
            let date = e.target.value.split('T');
            props.updateValue(props.name, date[0], date[1]);
        }} value={props.formData[props.name] ? props.formData[props.name] + "T" + props.formData[props.name + '_time'] : ''}/>
    </div> 
}

export function IOObjectField(props) {
    let [state, setState] = useState({});

    return <div>
        <TextField 
            label={props.label} 
            InputLabelProps={{shrink: true}} 
            value={props.formData[props.name] || ""}
            onChange={(e) => {
                props.updateValue(props.name, e.target.value)
            }}
        />
        <IconButton size="small" onClick={()=>{setState({showDialog: true})}} style={{verticalAlign: "bottom"}}>
            <IconFolderOpened/>
        </IconButton>
        {state.showDialog ? <DialogSelectID
                key="selectDialog"
                socket={ props.socket }
                dialogName={props.name}
                title={ I18n.t('Select for ') + props.label}
                selected={ props.formData[props.name] }
                onOk={ (e) => {props.updateValue(props.name, e); setState({showDialog: false});} }
                onClose={ () => setState({showDialog: false}) }
            /> : null
        }
    </div>    
}

export function IOColorPicker(props) {
    return <div>
        <ColorPicker 
            label={props.label}
            inputProps={{
                style: {backgroundColor: props.formData[props.name]}
            }} 
            onChange={(color) => {
                props.updateValue(props.name, color)
            }} 
            InputLabelProps={{shrink: true}}
            value={props.formData[props.name] || ""}
        />
    </div>
}