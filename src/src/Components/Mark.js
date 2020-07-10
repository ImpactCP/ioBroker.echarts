import React from 'react';
import update from 'immutability-helper';

import I18n from '@iobroker/adapter-react/i18n';

import {IOTextField,IOCheckbox,IOColorPicker,IOSelect} from './Fields';

import {MdDelete as IconDelete} from 'react-icons/md';
import {MdModeEdit as IconEdit} from 'react-icons/md';
import IconButton from '@material-ui/core/IconButton';

class Mark extends React.Component {
    state = {
        /*
            "lineId":"0",
            "upperValueOrId":"20",
            "fill":"1",
            "color":"#FF0000",
            "ol":"1",
            "os":"0",
            "text":"11",
            "textPosition":"l",
            "textOffset":"2",
            "textColor":"#FF0000",
            "textSize":"2",
            "lowerValueOrId":"20"
        */
      };

    updateField = (name, value)=>{
        let newMark = update(this.props.mark, {[name]: {$set: value}});
        this.props.updateMark(this.props.index, newMark);
    }
    
    render() {
        return <>
            <div>
                <IconButton title={ I18n.t('Edit') }><IconEdit/></IconButton>
                <IconButton
                    size="small"
                    style={{ marginLeft: 5 }} aria-label="Delete" title={I18n.t('Delete')}
                    onClick={()=>{
                        this.props.deleteMark(this.props.index);
                    }}>
                    <IconDelete/>
                </IconButton>
            </div>
            <IOSelect formData={this.props.mark} updateValue={this.updateField} name="lineId" label="Line ID" options={{
                
            }}/>
            <IOTextField formData={this.props.mark} updateValue={this.updateField} name="upperValueOrId" label="Upper value or ID" />
            <IOTextField formData={this.props.mark} updateValue={this.updateField} name="lowerValueOrId" label="Lower value or ID" />
            <IOColorPicker formData={this.props.mark} updateValue={this.updateField} name="color" label="Color" />
            <IOCheckbox formData={this.props.mark} updateValue={this.updateField} name="fill" label="Fill"/>
            <IOTextField formData={this.props.mark} updateValue={this.updateField} name="ol" label="ØL"/>
            <IOTextField formData={this.props.mark} updateValue={this.updateField} name="os" label="ØS"/>
            <IOTextField formData={this.props.mark} updateValue={this.updateField} name="text" label="Text"/>
            <IOSelect formData={this.props.mark} updateValue={this.updateField} name="textPosition" label="Text position" options={{
                'l': 'Left',
                'r': 'Right',
            }}/>
            <IOTextField formData={this.props.mark} updateValue={this.updateField} name="textOffset" label="Text offset"/>
            <IOTextField formData={this.props.mark} updateValue={this.updateField} name="textSize" label="Text size"/>
            <IOColorPicker formData={this.props.mark} updateValue={this.updateField} name="textColor" label="Text color" />
        </>
    }
}

export default Mark;