import * as path from 'path';
import * as fs from 'fs-extra';
import tmp, { DirectoryResult } from 'tmp-promise';
import { exec } from '../../util/exec';
import { ifSystemSupportsGradle } from './__testutil__/gradle';
import {
  GRADLE_DEPENDENCY_REPORT_FILENAME,
  createRenovateGradlePlugin,
} from './gradle-updates-report';
import { GRADLE_DEPENDENCY_REPORT_OPTIONS } from './index';

const fixtures = 'lib/manager/gradle/__fixtures__';

describe('lib/manager/gradle/gradle-updates-report', () => {
  let workingDir: DirectoryResult;

  beforeEach(async () => {
    workingDir = await tmp.dir({ unsafeCleanup: true });
  });

  describe('createRenovateGradlePlugin', () => {
    for (const gradleVersion of [5, 6]) {
      ifSystemSupportsGradle(gradleVersion).it(
        `generates a report for Gradle version ${gradleVersion}`,
        // the function creation is correct and intended
        // eslint-disable-next-line no-loop-func
        async () => {
          await fs.copy(`${fixtures}/minimal-project`, workingDir.path);
          await fs.copy(
            `${fixtures}/gradle-wrappers/${gradleVersion}`,
            workingDir.path
          );
          await createRenovateGradlePlugin(workingDir.path);

          const gradlew = path.join(workingDir.path, 'gradlew');
          await exec(`${gradlew} ${GRADLE_DEPENDENCY_REPORT_OPTIONS}`, {
            cwd: workingDir.path,
          });
          expect(
            fs.readJSONSync(
              `${workingDir.path}/${GRADLE_DEPENDENCY_REPORT_FILENAME}`
            )
          ).toMatchSnapshot();
        },
        120000
      );
    }
  });
});
