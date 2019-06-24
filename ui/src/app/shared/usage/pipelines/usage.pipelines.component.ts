import {Component, Input} from '@angular/core';
import { Pipeline } from 'app/model/pipeline.model';
import { Project } from 'app/model/project.model';

@Component({
    selector: 'app-usage-pipelines',
    templateUrl: './usage.pipelines.html'
})
export class UsagePipelinesComponent {

    @Input() project: Project;
    @Input() pipelines: Array<Pipeline>;

    constructor() { }
}
